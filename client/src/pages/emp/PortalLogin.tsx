import { useState } from "react";
  import { trpc } from "@/lib/trpc";
  import { useLocation } from "wouter";

  export default function PortalLogin() {
    const [, navigate] = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const utils = trpc.useUtils();

    const loginMutation = trpc.empPortal.login.useMutation({
      onSuccess: () => {
        utils.empPortal.me.invalidate();
        navigate("/emp");
      },
      onError: (err) => setError(err.message || "Login failed"),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      loginMutation.mutate({ username, password });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4F2] to-[#E7ECE9] p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#6D7B74] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Employee Portal</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in with your employee account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#6D7B74] focus:outline-none focus:ring-2 focus:ring-[#C1CDC7]"
                  placeholder="Enter your username" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#6D7B74] focus:outline-none focus:ring-2 focus:ring-[#C1CDC7]"
                  placeholder="Enter your password" required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loginMutation.isPending}
                className="w-full rounded-lg bg-[#6D7B74] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5C6862] disabled:opacity-50 transition-colors"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Contact HR to get your login credentials
            </p>
          </div>
        </div>
      </div>
    );
  }
  