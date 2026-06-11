import { useState } from "react";
  import { trpc } from "@/lib/trpc";
  import { useLocation } from "wouter";

  export default function ChangePassword() {
    const [, navigate] = useLocation();
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const utils = trpc.useUtils();

    const { data: me, isLoading } = trpc.empPortal.me.useQuery(undefined, { retry: false });

    const changeMutation = trpc.empPortal.changePassword.useMutation({
      onSuccess: () => {
        setSuccess(true);
        utils.empPortal.me.invalidate();
        setTimeout(() => navigate("/emp"), 1500);
      },
      onError: (err) => setError(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (newPassword !== confirm)  { setError("Passwords do not match.");                  return; }
      changeMutation.mutate({ newPassword });
    };

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {me?.mustChangePassword ? "Set Your New Password" : "Change Password"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {me?.mustChangePassword
                  ? "For security, please choose a new password before continuing."
                  : "Choose a strong password to protect your account."}
              </p>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-green-700">Password changed successfully!</p>
                <p className="text-sm text-slate-500 mt-1">Redirecting to your dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="At least 8 characters" required minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Repeat your new password" required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={changeMutation.isPending}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {changeMutation.isPending ? "Saving..." : "Set New Password"}
                </button>

                {!me?.mustChangePassword && (
                  <button type="button" onClick={() => navigate("/emp")}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 text-center py-1">
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }
  