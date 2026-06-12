import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Download, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["present", "absent", "late", "early_leave", "on_leave", "holiday"];

const L: Record<string, { en: string; ar: string }> = {
  title: { en: "Attendance Management", ar: "إدارة الحضور" },
  subtitle: { en: "records", ar: "سجل" },
  daily: { en: "Daily Records", ar: "السجلات اليومية" },
  late: { en: "Late Arrivals", ar: "تأخيرات الحضور" },
  early: { en: "Early Departures", ar: "مغادرة مبكرة" },
  missing: { en: "Missing Check-outs", ar: "بدون تسجيل خروج" },
  gps: { en: "GPS Log", ar: "سجل الموقع" },
  export: { en: "Export to Excel", ar: "تصدير إلى Excel" },
  add: { en: "Add Record", ar: "إضافة سجل" },
  edit: { en: "Edit Record", ar: "تعديل سجل" },
  employee: { en: "Employee", ar: "الموظف" },
  branch: { en: "Branch", ar: "الفرع" },
  date: { en: "Date", ar: "التاريخ" },
  checkIn: { en: "Check In", ar: "تسجيل الدخول" },
  checkOut: { en: "Check Out", ar: "تسجيل الخروج" },
  hours: { en: "Hours", ar: "الساعات" },
  delay: { en: "Delay (min)", ar: "التأخير (دقيقة)" },
  early2: { en: "Early Leave (min)", ar: "الخروج المبكر (دقيقة)" },
  status: { en: "Status", ar: "الحالة" },
  actions: { en: "Actions", ar: "إجراءات" },
  all: { en: "All", ar: "الكل" },
  noData: { en: "No records found", ar: "لا توجد سجلات" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  save: { en: "Save", ar: "حفظ" },
  method: { en: "Method", ar: "الطريقة" },
  time: { en: "Time", ar: "الوقت" },
  distance: { en: "Distance", ar: "المسافة" },
  result: { en: "Result", ar: "النتيجة" },
  accepted: { en: "Accepted", ar: "مقبول" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  type: { en: "Type", ar: "النوع" },
};

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  present: { en: "Present", ar: "حاضر" },
  absent: { en: "Absent", ar: "غائب" },
  late: { en: "Late", ar: "متأخر" },
  early_leave: { en: "Early Leave", ar: "خروج مبكر" },
  on_leave: { en: "On Leave", ar: "إجازة" },
  holiday: { en: "Holiday", ar: "عطلة" },
};

const STATUS_BADGE: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-orange-100 text-orange-700",
  early_leave: "bg-amber-100 text-amber-700",
  on_leave: "bg-purple-100 text-purple-700",
  holiday: "bg-slate-100 text-slate-600",
};

const defaultForm = {
  employeeId: "",
  date: "",
  checkIn: "",
  checkOut: "",
  status: "present",
  delayMinutes: "",
  earlyLeaveMinutes: "",
  notes: "",
};

export default function Attendance() {
  const { lang, isRTL } = useLanguage();
  const tx = (k: string) => (L[k] ? L[k][lang] : k);
  const sx = (s: string) => (STATUS_LABELS[s] ? STATUS_LABELS[s][lang] : s);

  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [branchFilter, setBranchFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [tab, setTab] = useState("daily");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const utils = trpc.useUtils();

  const listFilter: any = {
    dateFrom,
    dateTo,
    employeeId: empFilter ? Number(empFilter) : undefined,
    branchId: branchFilter ? Number(branchFilter) : undefined,
  };
  const { data: records = [], isLoading } = trpc.attendance.list.useQuery(listFilter);
  const { data: events = [] } = trpc.attendance.events.useQuery(listFilter, { enabled: tab === "gps" });
  const { data: employees = [] } = trpc.employee.list.useQuery({});
  const { data: branches = [] } = trpc.branch.list.useQuery();

  const empName = (id: number) => {
    const e = employees.find((x: any) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : `#${id}`;
  };
  const branchName = (id?: number | null) => {
    if (!id) return "—";
    const b = branches.find((x: any) => x.id === id);
    return b?.name || `#${id}`;
  };
  const fmtTime = (v?: string | null) =>
    v ? new Date(v).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }) : "—";
  const fmtHours = (m?: number | null) => {
    if (!m || m <= 0) return "—";
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const createMutation = trpc.attendance.create.useMutation({
    onSuccess: () => {
      utils.attendance.list.invalidate();
      toast.success(lang === "ar" ? "تمت الإضافة" : "Record added");
      setDialogOpen(false);
      setForm({ ...defaultForm });
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.attendance.update.useMutation({
    onSuccess: () => {
      utils.attendance.list.invalidate();
      toast.success(lang === "ar" ? "تم التحديث" : "Record updated");
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.attendance.delete.useMutation({
    onSuccess: () => {
      utils.attendance.list.invalidate();
      toast.success(lang === "ar" ? "تم الحذف" : "Record deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ ...defaultForm, date: new Date().toISOString().split("T")[0] });
    setDialogOpen(true);
  };
  const openEdit = (r: any) => {
    setEditId(r.id);
    const ci = fmtTime(r.checkIn);
    const co = fmtTime(r.checkOut);
    setForm({
      employeeId: String(r.employeeId),
      date: r.date || "",
      checkIn: ci === "—" ? "" : ci,
      checkOut: co === "—" ? "" : co,
      status: r.status || "present",
      delayMinutes: r.delayMinutes ? String(r.delayMinutes) : "",
      earlyLeaveMinutes: r.earlyLeaveMinutes ? String(r.earlyLeaveMinutes) : "",
      notes: r.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.employeeId || !form.date) {
      toast.error(lang === "ar" ? "الموظف والتاريخ مطلوبان" : "Employee and date are required");
      return;
    }
    const payload: any = {
      employeeId: Number(form.employeeId),
      date: form.date,
      status: form.status,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      delayMinutes: form.delayMinutes ? Number(form.delayMinutes) : undefined,
      earlyLeaveMinutes: form.earlyLeaveMinutes ? Number(form.earlyLeaveMinutes) : undefined,
      notes: form.notes || undefined,
    };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const lateRecords = useMemo(
    () => records.filter((r: any) => r.status === "late" || (r.delayMinutes || 0) > 0),
    [records]
  );
  const earlyRecords = useMemo(
    () => records.filter((r: any) => r.status === "early_leave" || (r.earlyLeaveMinutes || 0) > 0),
    [records]
  );
  const missingRecords = useMemo(() => records.filter((r: any) => r.checkIn && !r.checkOut), [records]);

  const stats = {
    present: records.filter((r: any) => r.status === "present").length,
    late: lateRecords.length,
    early: earlyRecords.length,
    missing: missingRecords.length,
  };

  const exportCsv = (rows: string[][], filename: string) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCurrent = () => {
    if (tab === "gps") {
      const header = [tx("employee"), tx("branch"), tx("type"), tx("method"), tx("date"), tx("time"), tx("distance"), tx("result")];
      const rows = events.map((e: any) => [
        empName(e.employeeId),
        branchName(e.branchId),
        e.type,
        e.method,
        e.localDate,
        fmtTime(e.eventAt),
        e.distanceMeters != null ? `${Math.round(Number(e.distanceMeters))}m` : "",
        e.accepted ? tx("accepted") : tx("rejected"),
      ]);
      exportCsv([header, ...rows], `gps-log-${dateFrom}_${dateTo}.csv`);
      return;
    }
    const src = tab === "late" ? lateRecords : tab === "early" ? earlyRecords : tab === "missing" ? missingRecords : records;
    const header = [tx("employee"), tx("branch"), tx("date"), tx("checkIn"), tx("checkOut"), tx("hours"), tx("delay"), tx("early2"), tx("status")];
    const rows = src.map((r: any) => [
      empName(r.employeeId),
      branchName(r.branchId),
      r.date,
      fmtTime(r.checkIn),
      fmtTime(r.checkOut),
      fmtHours(r.workedMinutes),
      String(r.delayMinutes || 0),
      String(r.earlyLeaveMinutes || 0),
      sx(r.status),
    ]);
    exportCsv([header, ...rows], `attendance-${tab}-${dateFrom}_${dateTo}.csv`);
  };

  const renderRows = (src: any[]) =>
    isLoading ? (
      Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-slate-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))
    ) : src.length === 0 ? (
      <tr>
        <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
          {tx("noData")}
        </td>
      </tr>
    ) : (
      src.map((r: any) => (
        <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
          <td className="px-4 py-3 font-medium text-slate-900">{empName(r.employeeId)}</td>
          <td className="px-4 py-3 text-slate-600">{branchName(r.branchId)}</td>
          <td className="px-4 py-3 text-slate-600">{r.date}</td>
          <td className="px-4 py-3 text-slate-600">{fmtTime(r.checkIn)}</td>
          <td className="px-4 py-3 text-slate-600">{fmtTime(r.checkOut)}</td>
          <td className="px-4 py-3 text-slate-600">{fmtHours(r.workedMinutes)}</td>
          <td className="px-4 py-3 text-orange-500">{r.delayMinutes ? `${r.delayMinutes}` : "—"}</td>
          <td className="px-4 py-3">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_BADGE[r.status] || "bg-slate-100 text-slate-600")}>
              {sx(r.status)}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(r)}>
                <Edit size={13} />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => deleteMutation.mutate({ id: r.id })}>
                <Trash2 size={13} />
              </Button>
            </div>
          </td>
        </tr>
      ))
    );

  const tableHead = (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50">
        {[tx("employee"), tx("branch"), tx("date"), tx("checkIn"), tx("checkOut"), tx("hours"), tx("delay"), tx("status"), tx("actions")].map((h, i) => (
          <th key={i} className="text-start px-4 py-3 font-medium text-slate-600">
            {h}
          </th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="p-4 lg:p-6" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader
        title={tx("title")}
        subtitle={`${records.length} ${tx("subtitle")}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={exportCurrent} size="sm" variant="outline" className="gap-2">
              <Download size={15} />
              {tx("export")}
            </Button>
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus size={16} />
              {tx("add")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: sx("present"), value: stats.present, color: "text-green-600" },
          { label: tx("late"), value: stats.late, color: "text-orange-500" },
          { label: tx("early"), value: stats.early, color: "text-amber-500" },
          { label: tx("missing"), value: stats.missing, color: "text-red-500" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 h-9 text-sm" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 h-9 text-sm" />
        <Select value={branchFilter || "all"} onValueChange={(v) => setBranchFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder={tx("branch")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx("all")}</SelectItem>
            {branches.map((b: any) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={empFilter || "all"} onValueChange={(v) => setEmpFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder={tx("employee")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tx("all")}</SelectItem>
            {employees.map((e: any) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="daily">{tx("daily")}</TabsTrigger>
          <TabsTrigger value="late">{tx("late")}</TabsTrigger>
          <TabsTrigger value="early">{tx("early")}</TabsTrigger>
          <TabsTrigger value="missing">{tx("missing")}</TabsTrigger>
          <TabsTrigger value="gps" className="gap-1">
            <MapPin size={13} />
            {tx("gps")}
          </TabsTrigger>
        </TabsList>

        {["daily", "late", "early", "missing"].map((tk) => (
          <TabsContent key={tk} value={tk}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {tableHead}
                  <tbody>
                    {renderRows(tk === "late" ? lateRecords : tk === "early" ? earlyRecords : tk === "missing" ? missingRecords : records)}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        ))}

        <TabsContent value="gps">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[tx("employee"), tx("branch"), tx("type"), tx("method"), tx("date"), tx("time"), tx("distance"), tx("result")].map((h, i) => (
                      <th key={i} className="text-start px-4 py-3 font-medium text-slate-600">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        {tx("noData")}
                      </td>
                    </tr>
                  ) : (
                    events.map((e: any) => (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{empName(e.employeeId)}</td>
                        <td className="px-4 py-3 text-slate-600">{branchName(e.branchId)}</td>
                        <td className="px-4 py-3 text-slate-600">{e.type === "check_in" ? tx("checkIn") : tx("checkOut")}</td>
                        <td className="px-4 py-3 text-slate-600 uppercase text-xs">{e.method}</td>
                        <td className="px-4 py-3 text-slate-600">{e.localDate}</td>
                        <td className="px-4 py-3 text-slate-600">{fmtTime(e.eventAt)}</td>
                        <td className="px-4 py-3 text-slate-600">{e.distanceMeters != null ? `${Math.round(Number(e.distanceMeters))}m` : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", e.accepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {e.accepted ? tx("accepted") : tx("rejected")}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? tx("edit") : tx("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{tx("employee")} *</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={tx("employee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.firstName} {e.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("date")} *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {sx(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("checkIn")}</Label>
              <Input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("checkOut")}</Label>
              <Input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("delay")}</Label>
              <Input type="number" value={form.delayMinutes} onChange={(e) => setForm({ ...form, delayMinutes: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tx("early2")}</Label>
              <Input type="number" value={form.earlyLeaveMinutes} onChange={(e) => setForm({ ...form, earlyLeaveMinutes: e.target.value })} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tx("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {tx("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
