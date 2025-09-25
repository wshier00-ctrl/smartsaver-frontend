import React from "react";
import { Link } from "react-router-dom";
import AuthModal from "./components/AuthModal";
import { supabase } from "./lib/supabase";
import { startCheckout } from "./utils/checkout";

type Profile = {
  subscription_status: string | null;
  stripe_customer_id: string | null;
};

export default function App() {
  const [authOpen, setAuthOpen] = React.useState(false);
  const [user, setUser] = React.useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [query, setQuery] = React.useState("");
  const [zip, setZip] = React.useState("");

  // load auth user + keep in sync
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email || undefined });
      else setUser(null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || undefined });
        // fetch profile
        const { data } = await supabase
          .from("profiles")
          .select("subscription_status,stripe_customer_id")
          .eq("id", session.user.id)
          .maybeSingle();
        setProfile((data as Profile) || null);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleUpgrade() {
    if (!user?.id || !user?.email) { setAuthOpen(true); return; }
    await startCheckout(user.id, user.email, "monthly");
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    alert(`(Demo) Searching "${query}" near ZIP ${zip || "-----"}`);
  }

  const isPremium = profile?.subscription_status === "active";

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight text-emerald-600">SmartSaver</Link>
          <nav className="hidden md:flex gap-6 text-sm text-neutral-700">
            <a href="#search" className="hover:text-neutral-900">Search</a>
            <a href="#pricing" className="hover:text-neutral-900">Pricing</a>
            <a href="#reviews" className="hover:text-neutral-900">Reviews</a>
          </nav>
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button onClick={() => setAuthOpen(true)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white">
                  Create account
                </button>
                <button onClick={() => setAuthOpen(true)} className="rounded-xl border px-3 py-2 text-sm">
                  Sign in
                </button>
              </>
            ) : (
              <>
                {isPremium && (
                  <span className="hidden sm:inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                    Premium
                  </span>
                )}
                <Link to="/account" className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white">Account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            America’s Price-Comparison Tool
          </h1>
          <p className="mt-3 text-white/90 max-w-2xl">
            Compare millions of products across 200+ retailers in all 50 states. Start saving today.
          </p>

          <div id="search" className="mt-8 bg-white rounded-2xl p-4 text-black shadow">
            <form onSubmit={onSearch} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_110px] gap-3 items-center">
              <input
                className="rounded-xl border px-3 py-2 outline-none ring-emerald-500/0 focus:ring-2"
                placeholder="Search groceries instantly — for free"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <input
                className="rounded-xl border px-3 py-2"
                placeholder="ZIP (optional)"
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              />
              <button className="rounded-xl bg-blue-600 text-white py-2">Search</button>
            </form>
            <p className="mt-2 text-xs text-neutral-600">🔒 Secure checkout by Stripe.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-bold text-center">Choose Your Plan</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border shadow-sm bg-white p-6">
            <h3 className="text-xl font-semibold">Free Plan</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>✅ Grocery comparisons</li>
              <li>✅ Search across 50 states</li>
              <li>✅ Starter deals</li>
            </ul>
            <button onClick={() => setAuthOpen(true)} className="mt-6 w-full rounded-xl border px-4 py-2">
              Get started free
            </button>
          </div>

          <div className="rounded-2xl border-2 border-yellow-400 shadow bg-white p-6">
            <h3 className="text-xl font-semibold">Premium Plan</h3>
            <div className="text-3xl font-extrabold mt-1">$9.99 <span className="text-base font-medium">/month</span></div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li>✅ Everything in Free</li>
              <li>✅ All departments (electronics, home, apparel…)</li>
              <li>✅ 200+ retailers</li>
              <li>✅ Advanced filters & alerts</li>
            </ul>
            <button className="mt-6 w-full rounded-xl bg-emerald-600 text-white px-4 py-2" onClick={handleUpgrade}>
              Upgrade to Premium
            </button>
            <div className="mt-3 text-xs text-neutral-500">🔒 Stripe Secure Checkout</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="container mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-bold text-center">What users say</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <blockquote className="rounded-xl border p-4 bg-white shadow-sm">
            <div className="font-semibold">Jasmine T.</div>
            <div className="text-yellow-500" aria-label="5 stars">★★★★★</div>
            <p className="mt-2 text-sm">Found cheaper groceries near me in minutes. My weekly bill dropped a lot.</p>
          </blockquote>
          <blockquote className="rounded-xl border p-4 bg-white shadow-sm">
            <div className="font-semibold">Mark D.</div>
            <div className="text-yellow-500" aria-label="5 stars">★★★★★</div>
            <p className="mt-2 text-sm">Compared prices across stores without opening 10 tabs. Huge time saver.</p>
          </blockquote>
          <blockquote className="rounded-xl border p-4 bg-white shadow-sm">
            <div className="font-semibold">Elena R.</div>
            <div className="text-yellow-500" aria-label="5 stars">★★★★★</div>
            <p className="mt-2 text-sm">Caught a sale on my go-to coffee—stocked up instantly.</p>
          </blockquote>
        </div>
      </section>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthed={() => setAuthOpen(false)} />
    </>
  );
}