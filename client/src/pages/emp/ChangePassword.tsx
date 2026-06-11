import { useState } from "react";
  import { trpc } from "@/lib/trpc";
  import { useLocation } from "wouter";

  export default function ChangePassword() {
    const [, navigate] = useLocation();
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");

    const mutation = trpc.empPortal.changePassword.useMutation({
      onSuccess: () => navigate("/emp"),
      onError: (err) => setError(err.message || "Failed to change password"),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (newPassword !== confirm) { setError("Passwords do not match"); return; }
      mutation.mutate({ newPassword });
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
              <p className="text-sm text-slate-500 mt-1">You must change your password before continuing</p>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {mutation.isPending ? "Saving..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  