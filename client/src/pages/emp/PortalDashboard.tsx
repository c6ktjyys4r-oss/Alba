import PortalLayout from "./PortalLayout";
  import { trpc } from "@/lib/trpc";
  import { Link } from "wouter";

  function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
    return (
      <div className={`rounded-xl border p-5 bg-white shadow-sm`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("text-", "bg-").replace("-600", "-100")}`}>
            <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  function RequestBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
  }

  export default function PortalDashboard() {
    const { data: me } = trpc.empPortal.me.useQuery(undefined, { retry: false });
    const { data: balance } = trpc.empPortal.myLeaveBalance.useQuery(undefined, { retry: false });
    const { data: requests } = trpc.empPortal.myRequests.useQuery(undefined, { retry: false });
    const { data: notifications } = trpc.empPortal.myNotifications.useQuery(undefined, { retry: false });

    const pending = requests?.filter((r: any) => r.status === "pending").length ?? 0;
    const approved = requests?.filter((r: any) => r.status === "approved").length ?? 0;
    const rejected = requests?.filter((r: any) => r.status === "rejected").length ?? 0;
    const unread = notifications?.filter((n: any) => !n.isRead).length ?? 0;
    const annualRemaining = (balance?.annualDaysTotal ?? 21) - (balance?.annualDaysUsed ?? 0);

    const recent = requests?.slice(0, 5) ?? [];

    const TYPE_LABELS: Record<string, string> = {
      annual_leave: "Annual Leave",
      sick_leave: "Sick Leave",
      late_arrival: "Late Arrival",
      early_exit: "Early Exit",
    };

    return (
      <PortalLayout>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {me?.firstName} 👋
            </h1>
            <p className="text-slate-500 mt-1">{me?.jobTitle} · {(me as any)?.department?.name} · {new Date().toLocaleDateString("en-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          {/* Profile Info */}
          <div className="rounded-xl border bg-white p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Full Name", value: `${me?.firstName} ${me?.lastName}` },
                { label: "Job Title", value: me?.jobTitle || "—" },
                { label: "Department", value: (me as any)?.department?.name || "—" },
                { label: "Direct Manager", value: (me as any)?.directManager ? `${(me as any).directManager.firstName} ${(me as any).directManager.lastName}` : "—" },
                { label: "Email", value: me?.email || "—" },
                { label: "Phone", value: me?.phone || "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-slate-400 text-xs">{item.label}</p>
                  <p className="font-medium text-slate-800 mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Annual Leave Left" value={annualRemaining + " days"} color="text-blue-600" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <StatCard label="Pending Requests" value={pending} color="text-amber-600" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Approved" value={approved} color="text-green-600" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            <StatCard label="Unread Notifications" value={unread} color="text-purple-600" icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </div>

          {/* Leave Balance Card */}
          <div className="rounded-xl border bg-white p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Leave Balance — {new Date().getFullYear()}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-700">{annualRemaining}</p>
                <p className="text-sm text-blue-600 mt-1">Days Remaining</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-700">{balance?.annualDaysUsed ?? 0}</p>
                <p className="text-sm text-slate-500 mt-1">Days Used</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-700">{balance?.annualDaysTotal ?? 21}</p>
                <p className="text-sm text-slate-500 mt-1">Total Entitlement</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((balance?.annualDaysUsed ?? 0) / (balance?.annualDaysTotal ?? 21)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{balance?.annualDaysUsed ?? 0} of {balance?.annualDaysTotal ?? 21} days used</p>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Requests</h2>
              <Link href="/emp/requests" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </div>
            {recent.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p>No requests yet.</p>
                <Link href="/emp/requests/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">Submit your first request →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recent.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{TYPE_LABELS[r.type] ?? r.type}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <RequestBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PortalLayout>
    );
  }
  