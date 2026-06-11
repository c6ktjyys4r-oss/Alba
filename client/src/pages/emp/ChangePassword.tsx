import { useState } from "react";
  import { trpc } from "@/lib/trpc";
  import PortalLayout from "./PortalLayout";

  export default function ChangePassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const mutation = trpc.empPortal.changePassword.useMutation({
      onSuccess: () => {
        setSuccess(true);
        setNewPassword("");
        setConfirm("");
        setError("");
      },
      onError: (err) => setError(err.message || "Failed to change password"),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess(false);
      if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (newPassword !== confirm) { setError("Passwords do not match"); return; }
      mutation.mutate({ newPassword });
    };

    return (
      <PortalLayout>
        <div className="p-6 max-w-lg">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Change Password</h1>
          <p className="text-sm text-slate-500 mb-6">Update your account password</p>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">Password updated successfully.</div>
            )}
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
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {mutation.isPending ? "Saving..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </PortalLayout>
    );
  }
  