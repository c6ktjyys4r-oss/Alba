import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AlbaLogo from "@/components/AlbaLogo";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      navigate(data.role === "super_admin" ? "/" : "/emp");
    },
    onError: (err) => {
      setError(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F0F2] to-[#E7ECE9] p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <AlbaLogo />
            <p className="mt-3 text-sm text-slate-500">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#6D7B74] focus:outline-none focus:ring-2 focus:ring-[#C1CDC7]"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#6D7B74] focus:outline-none focus:ring-2 focus:ring-[#C1CDC7]"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-lg bg-[#6D7B74] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5C6862] focus:outline-none focus:ring-2 focus:ring-[#6D7B74] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
