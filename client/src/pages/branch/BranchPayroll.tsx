import { Fragment, useState } from "react";
import PortalLayout from "../emp/PortalLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  branch_approved: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  branch_approved: "Branch approved",
  approved: "Approved",
  paid: "Paid",
};

const now = new Date();

export default function BranchPayroll() {
  const { lang } = useLanguage();
  const utils = trpc.useUtils();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editor, setEditor] = useState<{ id: number; kind: "overtime" | "adjust" } | null>(null);
  const [otHours, setOtHours] = useState("");
  const [otAmount, setOtAmount] = useState("");
  const [adjAmount, setAdjAmount] = useState("");

  const { data: records, isLoading } = trpc.branchManager.payroll.list.useQuery({ month, year }, { retry: false });

  const refresh = () => utils.branchManager.payroll.list.invalidate();
  const closeEditor = () => { setEditor(null); setOtHours(""); setOtAmount(""); setAdjAmount(""); };

  const overtime = trpc.branchManager.payroll.addOvertime.useMutation({
    onSuccess: () => { toast.success("Overtime added"); refresh(); closeEditor(); },
    onError: (e) => toast.error(e.message),
  });
  const adjust = trpc.branchManager.payroll.applyAdjustment.useMutation({
    onSuccess: () => { toast.success("Adjustment applied"); refresh(); closeEditor(); },
    onError: (e) => toast.error(e.message),
  });
  const approve = trpc.branchManager.payroll.branchApprove.useMutation({
    onSuccess: () => { toast.success("Branch-approved"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const empName = (r: any) => r.employeeName ?? `Employee #${r.employeeId}`;
  const money = (v: any) => Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <PortalLayout>
      <div className="p-8">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
            <p className="text-slate-500 mt-1">
              Review, add overtime/adjustments, and branch-approve. Final approval is by a Super Admin.
            </p>
          </div>
          <div className="flex gap-2">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-[#CDD8D2] bg-white text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString(lang === "ar" ? "ar" : "en", { month: "long" })}</option>
              ))}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-[#CDD8D2] bg-white text-sm" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8E4] overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7F6] text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Employee</th>
                <th className="px-4 py-3 text-end font-medium">Basic</th>
                <th className="px-4 py-3 text-end font-medium">Overtime</th>
                <th className="px-4 py-3 text-end font-medium">Adjustments</th>
                <th className="px-4 py-3 text-end font-medium">Net</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : (records?.length ?? 0) === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No payroll records for this period</td></tr>
              ) : (
                records?.map((r: any) => (
                  <Fragment key={r.id}>
                    <tr className="border-t border-[#EEF2F0]">
                      <td className="px-4 py-3 text-slate-900 font-medium">{empName(r)}</td>
                      <td className="px-4 py-3 text-end text-slate-600">{money(r.basicSalary)}</td>
                      <td className="px-4 py-3 text-end text-slate-600">{money(r.overtimeAmount)}</td>
                      <td className="px-4 py-3 text-end text-slate-600">{money(r.adjustments)}</td>
                      <td className="px-4 py-3 text-end font-semibold text-slate-900">{money(r.netSalary)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        {r.status === "draft" ? (
                          <div className="inline-flex gap-2">
                            <button onClick={() => { closeEditor(); setEditor({ id: r.id, kind: "overtime" }); }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#CDD8D2] text-xs font-medium text-[#4A574F] hover:bg-[#F0F4F2]">Overtime</button>
                            <button onClick={() => { closeEditor(); setEditor({ id: r.id, kind: "adjust" }); }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#CDD8D2] text-xs font-medium text-[#4A574F] hover:bg-[#F0F4F2]">Adjust</button>
                            <button onClick={() => approve.mutate({ id: r.id })} disabled={approve.isPending}
                              className="px-2.5 py-1.5 rounded-lg bg-[#6D7B74] text-white text-xs font-medium hover:bg-[#5d6a63] disabled:opacity-50">Approve</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {r.status === "branch_approved" ? "Awaiting Super Admin" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                    {editor?.id === r.id && (
                      <tr className="bg-[#F8FAF9]">
                        <td colSpan={7} className="px-4 py-3">
                          {editor.kind === "overtime" ? (
                            <div className="flex items-end gap-3 flex-wrap">
                              <label className="text-xs text-slate-500">Hours
                                <input type="number" value={otHours} onChange={(e) => setOtHours(e.target.value)}
                                  className="block mt-1 w-28 px-2 py-1.5 rounded-lg border border-[#CDD8D2] text-sm" />
                              </label>
                              <label className="text-xs text-slate-500">Amount (SAR)
                                <input type="number" value={otAmount} onChange={(e) => setOtAmount(e.target.value)}
                                  className="block mt-1 w-32 px-2 py-1.5 rounded-lg border border-[#CDD8D2] text-sm" />
                              </label>
                              <button
                                onClick={() => overtime.mutate({ id: r.id, hours: Number(otHours) || 0, amount: Number(otAmount) || 0 })}
                                disabled={overtime.isPending || !otAmount}
                                className="px-3 py-1.5 rounded-lg bg-[#6D7B74] text-white text-sm font-medium hover:bg-[#5d6a63] disabled:opacity-50">Add overtime</button>
                              <button onClick={closeEditor} className="px-3 py-1.5 rounded-lg border border-[#CDD8D2] text-sm">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-end gap-3 flex-wrap">
                              <label className="text-xs text-slate-500">Adjustment (SAR — negative for a deduction)
                                <input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)}
                                  className="block mt-1 w-48 px-2 py-1.5 rounded-lg border border-[#CDD8D2] text-sm" />
                              </label>
                              <button
                                onClick={() => adjust.mutate({ id: r.id, amount: Number(adjAmount) || 0 })}
                                disabled={adjust.isPending || !adjAmount}
                                className="px-3 py-1.5 rounded-lg bg-[#6D7B74] text-white text-sm font-medium hover:bg-[#5d6a63] disabled:opacity-50">Apply</button>
                              <button onClick={closeEditor} className="px-3 py-1.5 rounded-lg border border-[#CDD8D2] text-sm">Cancel</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
}
