import PortalLayout from "../emp/PortalLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BranchDepartments() {
  const { lang } = useLanguage();
  const { data: departments, isLoading } = trpc.branchManager.departments.useQuery(undefined, { retry: false });
  const { data: employees } = trpc.branchManager.employees.useQuery(undefined, { retry: false });
  const managerName = (id: number | null) => {
    if (id == null) return "—";
    const m = employees?.find((e: any) => e.id === id);
    if (!m) return `#${id}`;
    return (lang === "ar" && m.firstNameAr) ? `${m.firstNameAr} ${m.lastNameAr ?? ""}` : `${m.firstName} ${m.lastName}`;
  };

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-500 mt-1">Departments in your branch (view only)</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8E4] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7F6] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Department</th>
                <th className="px-4 py-3 text-start font-medium">Manager</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : (departments?.length ?? 0) === 0 ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No departments found</td></tr>
              ) : (
                departments?.map((d: any) => (
                  <tr key={d.id} className="border-t border-[#EEF2F0]">
                    <td className="px-4 py-3 text-slate-900 font-medium">{(lang === "ar" && d.nameAr) || d.name}</td>
                    <td className="px-4 py-3 text-slate-600">{managerName(d.directManagerId)}</td>
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
