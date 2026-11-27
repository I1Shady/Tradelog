import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowRight, LockKeyhole, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticate, useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const destination = (location.state as { from?: string } | null)?.from || "/journal";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await authenticate(isRegister ? "/api/auth/register" : "/api/auth/login", email, password);
      await refreshUser();
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#F4F6FA] px-4 py-12 text-slate-900 dark:bg-[#111c30] dark:text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-[#1c2a40] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white"><TrendingUp className="size-5" /></span>
          <div><p className="text-xl font-bold">Trade<span className="text-blue-500">Log</span></p><p className="text-xs text-slate-400">Your trades. Your progress.</p></div>
        </div>
        <h1 className="text-2xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{isRegister ? "Start building a clearer picture of your trading." : "Sign in to access your trading journal."}</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-300">Email address</label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-[#111c30]" /></div>
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-300">Password</label>
            <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input id="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 10 : 1} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? "At least 10 characters" : "Your password"} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-[#111c30]" /></div>
            {isRegister && <p className="mt-2 text-[11px] text-slate-400">Use at least 10 characters.</p>}
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-400/10 dark:text-red-300">{error}</p>}
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700">{busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}<ArrowRight className="ml-2 size-4" /></Button>
        </form>
        <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">{isRegister ? "Already have an account?" : "New to TradeLog?"} <Link className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400" to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}
