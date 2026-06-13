import PortalLayout from "../emp/PortalLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-600",
  on_leave: "bg-amber-100 text-amber-700",
  terminated: "bg-red-100 text-red-700",
};

export default function BranchEmployees() {
  const { lang } = useLanguage();
  const { data: employees, isLoading } = trpc.branchManager.employees.useQuery(undefined, { retry: false });
  const { data: departments } = trpc.branchManager.departments.useQuery(undefined, { retry: false });
  const deptName = (id: number | null) => {
    const d = departments?.find((x: any) => x.id === id);
    if (!d) return "—";
    return (lang === "ar" && d.nameAr) || d.name;
  };

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-500 mt-1">Employees in your branch (view only)</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8E4] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7F6] text-slate-500 text-start">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Name</th>
                <th className="px-4 py-3 text-start font-medium">Job title</th>
                <th className="px-4 py-3 text-start font-medium">Department</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : (employees?.length ?? 0) === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No employees found</td></tr>
              ) : (
                employees?.map((e: any) => (
                  <tr key={e.id} className="border-t border-[#EEF2F0]">
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {(lang === "ar" && e.firstNameAr) ? `${e.firstNameAr} ${e.lastNameAr ?? ""}` : `${e.firstName} ${e.lastName}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{(lang === "ar" && e.jobTitleAr) || e.jobTitle || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{deptName(e.departmentId)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[e.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
}
