import PortalLayout from "../emp/PortalLayout";
import { trpc } from "@/lib/trpc";
import { Users, UserCheck, Building2, Clock, ClipboardList } from "lucide-react";

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8E4] p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-lg bg-[#EEF3F0] text-[#6D7B74] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function BranchReports() {
  const { data: report, isLoading } = trpc.branchManager.report.useQuery(undefined, { retry: false });

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Branch Reports</h1>
          <p className="text-slate-500 mt-1">Overview of your branch</p>
        </div>

        {isLoading ? (
          <p className="text-slate-500">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Employees" value={report?.totalEmployees ?? 0} icon={<Users size={20} />} />
            <StatCard label="Active employees" value={report?.activeEmployees ?? 0} icon={<UserCheck size={20} />} />
            <StatCard label="Departments" value={report?.departments ?? 0} icon={<Building2 size={20} />} />
            <StatCard label="Present today" value={report?.presentToday ?? 0} icon={<Clock size={20} />} />
            <StatCard label="Pending requests" value={report?.pendingRequests ?? 0} icon={<ClipboardList size={20} />} />
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
