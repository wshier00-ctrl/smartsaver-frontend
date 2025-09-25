import React, { useState } from "react";
import { supabase } from "../lib/supabase";

type Props = { open: boolean; onClose: () => void; onAuthed?: () => void };

export default function AuthModal({ open, onClose, onAuthed }: Props) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function doSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      // create account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw error;

      // if confirm email is OFF, user is already signed in
      // if confirm email is ON, a confirmation email is sent
      if (data.user) {
        setMsg("Account created!");
        onAuthed?.();
        onClose();
      } else {
        setMsg("Check your email to confirm your account.");
      }
    } catch (e: any) {
      setErr(e?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function doSignin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMsg("Signed in!");
      onAuthed?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account`,
      });
      if (error) throw error;
      setMsg("Password reset email sent (if that email exists).");
    } catch (e: any) {
      setErr(e?.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[95%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {mode === "signup" ? "Create account" : "Sign in"}
          </h2>
          <button onClick={onClose} className="text-sm text-neutral-500 hover:text-black">✕</button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode==="signup"?"bg-emerald-600 text-white":"bg-neutral-100"}`}
          >
            Sign up
          </button>
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode==="signin"?"bg-emerald-600 text-white":"bg-neutral-100"}`}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={mode==="signup" ? doSignup : doSignin} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm">Username</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
          {msg && <div className="text-sm text-emerald-700">{msg}</div>}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:opacity-60"
          >
            {busy ? "Please wait..." : (mode==="signup" ? "Create account" : "Sign in")}
          </button>
        </form>

        {mode==="signin" && (
          <div className="mt-3 text-right">
            <button onClick={forgotPassword} className="text-sm text-blue-700 underline">
              Forgot password?
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-neutral-500">
          Supabase URL: <code>{import.meta.env.VITE_SUPABASE_URL ? "Loaded ✅" : "Missing ❌"}</code> ·
          Anon key: <code>{import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌"}</code>
        </div>
      </div>
    </div>
  );
}