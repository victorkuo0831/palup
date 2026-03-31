"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { email, password, name, companyName }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/app");
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative h-10 w-10 rounded-[12px] bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-[12px] bg-gradient-to-br from-white/20 to-transparent" />
            </div>
            <span className="text-[22px] font-semibold tracking-tight text-white">PalUp</span>
          </div>
          <h1 className="text-[20px] font-semibold text-zinc-200">
            {mode === "register" ? "Start selling with AI" : "Welcome back"}
          </h1>
          <p className="text-[14px] text-zinc-500 mt-2">
            {mode === "register"
              ? "Create your account and let your AI sales team get to work"
              : "Sign in to your AI sales dashboard"
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              required
              minLength={6}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-500/[0.08] border border-rose-500/20 px-4 py-3">
              <p className="text-[13px] text-rose-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-3 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
          >
            {loading
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Sign in"
            }
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center text-[13px] text-zinc-500">
          {mode === "register" ? (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Sign in
              </button>
            </>
          ) : (
            <>Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create one
              </button>
            </>
          )}
        </p>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-zinc-600">
          <span>Free to start</span>
          <span className="h-3 w-px bg-zinc-800" />
          <span>No credit card needed</span>
          <span className="h-3 w-px bg-zinc-800" />
          <span>Setup in 2 minutes</span>
        </div>
      </div>
    </div>
  );
}
