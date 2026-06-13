import { useState } from "react";
import PortalLayout from "../emp/PortalLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BranchAttendance() {
  const { lang } = useLanguage();
  const [date, setDate] = useState(today());
  const { data: events, isLoading } = trpc.branchManager.attendance.useQuery({ date }, { retry: false });
  const { data: employees } = trpc.branchManager.employees.useQuery(undefined, { retry: false });
  const empName = (id: number) => {
    const e = employees?.find((x: any) => x.id === id);
    if (!e) return `#${id}`;
    return (lang === "ar" && e.firstNameAr) ? `${e.firstNameAr} ${e.lastNameAr ?? ""}` : `${e.firstName} ${e.lastName}`;
  };

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
            <p className="text-slate-500 mt-1">Attendance for your branch (view only)</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#CDD8D2] bg-white text-sm"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8E4] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7F6] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Employee</th>
                <th className="px-4 py-3 text-start font-medium">Type</th>
                <th className="px-4 py-3 text-start font-medium">Time</th>
                <th className="px-4 py-3 text-start font-medium">Accepted</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : (events?.length ?? 0) === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No attendance events for this day</td></tr>
              ) : (
                events?.map((ev: any) => (
                  <tr key={ev.id} className="border-t border-[#EEF2F0]">
                    <td className="px-4 py-3 text-slate-900 font-medium">{empName(ev.employeeId)}</td>
                    <td className="px-4 py-3 text-slate-600">{String(ev.type).replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.eventAt ? new Date(ev.eventAt).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ev.accepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {ev.accepted ? "Yes" : "No"}
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
