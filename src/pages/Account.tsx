// src/pages/Account.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { startCheckout, openBillingPortal } from "../utils/checkout";

type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
};

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email || "");
      setUsername((user.user_metadata as any)?.username || "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("id,email,username,subscription_status,stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();

      if (prof) {
        setProfile(prof as Profile);
        if (prof.username) setUsername(prof.username);
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { username } });
    if (error) setMsg(error.message);
    else setMsg("Profile updated");
  }

  async function handleUpgrade(plan: "monthly" | "yearly" = "monthly") {
    if (!userId || !email) {
      alert("Please sign in first.");
      return;
    }
    await startCheckout(userId, email, plan);
  }

  async function handlePortal() {
    if (!profile?.stripe_customer_id) {
      alert("No Stripe customer linked yet. Complete a checkout first.");
      return;
    }
    await openBillingPortal(profile.stripe_customer_id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function addPriceDrop() {
    const q = prompt("What product do you want alerts for? (e.g., milk)");
    if (!q) return;
    const zip = prompt("ZIP (optional)") || null;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return alert("Please sign in first.");
    const { error } = await supabase.from("price_drop_subscriptions").insert({
      user_id: data.user.id,
      query: q,
      zip,
    } as any);
    if (error) alert(error.message);
    else alert("Alert added!");
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (!userId) return <div className="p-6">Please sign in from the home page.</div>;

  const plan = profile?.subscription_status || "free";

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Your Account</h1>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <form onSubmit={saveProfile} className="grid gap-3">
          <div>
            <div className="text-sm text-neutral-500">Email</div>
            <div className="text-lg">{email}</div>
          </div>
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {msg && <p className="text-sm text-neutral-700">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl bg-emerald-600 px-4 py-2 text-white">Save</button>
            <button type="button" onClick={signOut} className="rounded-xl bg-neutral-200 px-4 py-2">Sign out</button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-neutral-500">Plan</div>
        <div className="text-lg capitalize">{plan}</div>

        <div className="mt-3 flex flex-wrap gap-3">
          {plan === "active" ? (
            <button className="px-4 py-2 rounded bg-neutral-800 text-white" onClick={handlePortal}>
              Manage subscription
            </button>
          ) : (
            <>
              <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={() => handleUpgrade("monthly")}>
                Upgrade to Premium ($9.99/mo)
              </button>
              <button className="px-4 py-2 rounded bg-emerald-700 text-white" onClick={() => handleUpgrade("yearly")}>
                Go Yearly ($99/yr)
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-neutral-500 mt-3">🔒 Payments secured by <b>Stripe</b>.</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="font-semibold mb-2">Price-drop notifications</h2>
        <button onClick={addPriceDrop} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
          Add an alert
        </button>
      </div>
    </div>
  );
}