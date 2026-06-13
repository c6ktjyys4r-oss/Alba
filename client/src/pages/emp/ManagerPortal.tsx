import { useEffect, useState } from "react";
  import { useSearch } from "wouter";
  import PortalLayout from "./PortalLayout";
  import { trpc } from "@/lib/trpc";

  const TYPE_LABELS: Record<string, string> = {
    annual_leave: "Annual Leave",
    sick_leave: "Sick Leave",
    late_arrival: "Late Arrival",
    early_exit: "Early Exit",
  };

  type StatusFilter = "pending" | "approved" | "rejected" | "all";

  export default function ManagerPortal() {
    const search = useSearch();
    const focusedId = Number(new URLSearchParams(search).get("request")) || null;
    const [filter, setFilter] = useState<StatusFilter>("pending");
    const [comment, setComment] = useState<Record<number, string>>({});
    const [reviewing, setReviewing] = useState<number | null>(null);
    const utils = trpc.useUtils();

    const { data: me } = trpc.empPortal.me.useQuery(undefined, { retry: false });
    const { data: requests, isLoading, error: requestsError } = trpc.empManager.teamRequests.useQuery(undefined, { retry: false });

    // Deep-link from a notification: show all statuses so the request is visible,
    // open its review box, and scroll it into view.
    useEffect(() => {
      if (!focusedId || !requests) return;
      const target = requests.find((r: any) => r.id === focusedId);
      if (!target) return;
      setFilter("all");
      if (target.status === "pending") setReviewing(focusedId);
      const el = document.getElementById(`req-${focusedId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [focusedId, requests]);
    const { data: access } = trpc.empManager.access.useQuery(undefined, { retry: false });
    const { data: team } = trpc.empManager.branchTeam.useQuery(undefined, { retry: false });
    const [showTeam, setShowTeam] = useState(false);
    const reviewMutation = trpc.empManager.reviewRequest.useMutation({
      onSuccess: () => {
        utils.empManager.teamRequests.invalidate();
        utils.empPortal.myNotifications.invalidate();
        setReviewing(null);
      },
    });

    const filtered = requests?.filter((r: any) => filter === "all" || r.status === filter) ?? [];

    const getEmpName = (req: any) =>
      req.employeeName ?? `Employee #${req.employeeId}`;

    const counts = {
      all: requests?.length ?? 0,
      pending: requests?.filter((r: any) => r.status === "pending").length ?? 0,
      approved: requests?.filter((r: any) => r.status === "approved").length ?? 0,
      rejected: requests?.filter((r: any) => r.status === "rejected").length ?? 0,
    };

    const handleReview = (requestId: number, status: "approved" | "rejected") => {
      reviewMutation.mutate({
        requestId,
        status,
        comment: comment[requestId] || undefined,
      });
    };

    const TABS: { key: StatusFilter; label: string; color: string }[] = [
      { key: "pending",  label: `Pending (${counts.pending})`,   color: "amber"  },
      { key: "approved", label: `Approved (${counts.approved})`, color: "green"  },
      { key: "rejected", label: `Rejected (${counts.rejected})`, color: "red"    },
      { key: "all",      label: `All (${counts.all})`,           color: "slate"  },
    ];

    const accessDenied = (me && !me.isManager) || requestsError?.data?.code === "FORBIDDEN";
    if (accessDenied) {
      return (
        <PortalLayout>
          <div className="p-8">
            <div className="max-w-md mx-auto text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
              <h1 className="text-xl font-bold text-slate-900">Access restricted</h1>
              <p className="text-slate-500 mt-2">This area is only available to managers. You don't have permission to review team requests.</p>
            </div>
          </div>
        </PortalLayout>
      );
    }

    return (
      <PortalLayout>
        <div className="p-8">
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Team Approval Portal</h1>
              <p className="text-slate-500 mt-1">
                {access?.role === "super_admin"
                  ? "Reviewing requests across all branches"
                  : access?.role === "branch_manager"
                  ? "Reviewing requests within your branch"
                  : "Review and manage requests from your direct reports"}
              </p>
            </div>
            {(team?.length ?? 0) > 0 && (
              <button onClick={() => setShowTeam((v) => !v)}
                className="px-3 py-2 rounded-lg border border-[#CDD8D2] bg-white text-sm font-medium text-[#4A574F] hover:bg-[#F0F4F2] transition-colors">
                {showTeam ? "Hide" : "View"} branch team ({team?.length})
              </button>
            )}
          </div>

          {showTeam && (team?.length ?? 0) > 0 && (
            <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
                {access?.role === "super_admin" ? "All employees" : "Employees in your branch"}
              </div>
              <div className="divide-y divide-slate-100">
                {team!.map((m: any) => (
                  <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-800">{m.firstName} {m.lastName}</span>
                    <span className="text-xs text-slate-500">{m.jobTitle || "Employee"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Pending Review", value: counts.pending, color: "amber" },
              { label: "Approved",       value: counts.approved, color: "green" },
              { label: "Rejected",       value: counts.rejected, color: "red"   },
              { label: "Total",          value: counts.all,      color: "slate" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm text-center">
                <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading team requests...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                {filter === "pending" ? "🎉" : "📭"}
              </div>
              <p className="text-slate-500 font-medium">
                {filter === "pending" ? "No pending requests — all caught up!" : "No requests in this category"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req: any) => (
                <div key={req.id} id={`req-${req.id}`} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${focusedId === req.id ? "border-[#6D7B74] ring-2 ring-[#6D7B74]/30" : "border-slate-200"}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            req.status === "pending"  ? "bg-amber-100 text-amber-700 border-amber-200" :
                            req.status === "approved" ? "bg-green-100 text-green-700 border-green-200" :
                                                        "bg-red-100 text-red-700 border-red-200"
                          }`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                          <span className="text-xs text-slate-400">#{req.id}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{TYPE_LABELS[req.type] ?? req.type}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          👤 {getEmpName(req)}
                        </p>
                        {req.startDate && <p className="text-sm text-slate-500 mt-1">📅 {req.startDate}{req.endDate && req.endDate !== req.startDate ? ` → ${req.endDate}` : ""}{req.daysRequested ? ` (${req.daysRequested} days)` : ""}</p>}
                        {req.requestedDate && <p className="text-sm text-slate-500 mt-1">📅 {req.requestedDate}{req.requestedTime ? ` at ${req.requestedTime}` : ""}</p>}
                        {req.reason && <p className="text-sm text-slate-600 mt-2 italic">"{req.reason}"</p>}
                        {req.attachmentUrl && (
                          <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-lg border border-[#CDD8D2] bg-[#F0F4F2] text-sm font-medium text-[#4A574F] hover:bg-[#E4ECE8] transition-colors">
                            📎 View / download attachment
                          </a>
                        )}
                        {req.managerComment && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                            <p className="text-xs text-slate-500 font-medium mb-1">Your comment:</p>
                            <p className="text-sm text-slate-700">{req.managerComment}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-400 shrink-0">
                        <p>Submitted</p>
                        <p className="font-medium">{new Date(req.createdAt).toLocaleDateString()}</p>
                        {req.reviewedAt && <><p className="mt-2">Reviewed</p><p className="font-medium">{new Date(req.reviewedAt).toLocaleDateString()}</p></>}
                      </div>
                    </div>

                    {/* Action area for pending */}
                    {req.status === "pending" && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {reviewing === req.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={comment[req.id] ?? ""}
                              onChange={(e) => setComment((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              rows={2} placeholder="Optional comment for employee..."
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-[#6D7B74] focus:outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setReviewing(null)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                Cancel
                              </button>
                              <button type="button" onClick={() => handleReview(req.id, "rejected")}
                                disabled={reviewMutation.isPending}
                                className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">
                                ❌ Reject
                              </button>
                              <button type="button" onClick={() => handleReview(req.id, "approved")}
                                disabled={reviewMutation.isPending}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
                                ✅ Approve
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setReviewing(req.id)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                            Review Request →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PortalLayout>
    );
  }
  