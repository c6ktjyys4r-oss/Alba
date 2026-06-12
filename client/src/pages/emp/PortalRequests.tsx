import PortalLayout from "./PortalLayout";
  import { trpc } from "@/lib/trpc";
  import { Link } from "wouter";

  const TYPE_LABELS: Record<string, string> = {
    annual_leave: "Annual Leave",
    sick_leave: "Sick Leave",
    late_arrival: "Late Arrival",
    early_exit: "Early Exit",
  };

  const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending" },
    approved: { color: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
    rejected: { color: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
  };

  export default function PortalRequests() {
    const { data: requests, isLoading } = trpc.empPortal.myRequests.useQuery(undefined, { retry: false });

    const grouped = {
      pending:  requests?.filter((r: any) => r.status === "pending")  ?? [],
      approved: requests?.filter((r: any) => r.status === "approved") ?? [],
      rejected: requests?.filter((r: any) => r.status === "rejected") ?? [],
    };

    const RequestCard = ({ req }: { req: any }) => {
      const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sc.color}`}>{sc.label}</span>
                <span className="text-xs text-slate-400">#{req.id}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{TYPE_LABELS[req.type] ?? req.type}</h3>
              {req.startDate && <p className="text-sm text-slate-500 mt-1">📅 {req.startDate}{req.endDate && req.endDate !== req.startDate ? ` → ${req.endDate}` : ""}{req.daysRequested ? ` (${req.daysRequested} day${req.daysRequested > 1 ? "s" : ""})` : ""}</p>}
              {req.requestedDate && <p className="text-sm text-slate-500 mt-1">📅 {req.requestedDate}{req.requestedTime ? ` at ${req.requestedTime}` : ""}</p>}
              {req.reason && <p className="text-sm text-slate-600 mt-2 italic">"{req.reason}"</p>}
              {req.managerComment && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                  <p className="text-xs text-slate-500 font-medium mb-1">Manager comment:</p>
                  <p className="text-sm text-slate-700">{req.managerComment}</p>
                </div>
              )}
            </div>
            <div className="text-right text-xs text-slate-400 shrink-0">
              <p>{new Date(req.createdAt).toLocaleDateString()}</p>
              {req.reviewedAt && <p className="mt-1">Reviewed {new Date(req.reviewedAt).toLocaleDateString()}</p>}
            </div>
          </div>
        </div>
      );
    };

    return (
      <PortalLayout>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
              <p className="text-slate-500 mt-1">Track all your submitted requests</p>
            </div>
            <Link href="/emp/requests/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#6D7B74] text-white rounded-lg text-sm font-medium hover:bg-[#5C6862] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Request
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading requests...</div>
          ) : (requests?.length ?? 0) === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-slate-500 font-medium">No requests yet</p>
              <Link href="/emp/requests/new" className="mt-3 inline-block text-sm text-[#6D7B74] hover:underline">Submit your first request →</Link>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([status, reqs]) =>
                reqs.length > 0 ? (
                  <div key={status}>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      {STATUS_CONFIG[status]?.label ?? status} ({reqs.length})
                    </h2>
                    <div className="space-y-3">
                      {reqs.map((r: any) => <RequestCard key={r.id} req={r} />)}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </PortalLayout>
    );
  }
  