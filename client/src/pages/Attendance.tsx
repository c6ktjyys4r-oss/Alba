import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["present","absent","late","early_leave","on_leave","holiday"];

const defaultForm = { employeeId:"", date:"", checkIn:"", checkOut:"", status:"present", delayMinutes:"", earlyLeaveMinutes:"", notes:"" };

export default function Attendance() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(new Date(Date.now()-7*86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...defaultForm});
  const utils = trpc.useUtils();

  const { data: records = [], isLoading } = trpc.attendance.list.useQuery({ dateFrom, dateTo, status:statusFilter||undefined, employeeId:empFilter?Number(empFilter):undefined });
  const { data: employees = [] } = trpc.employee.list.useQuery({});

  const createMutation = trpc.attendance.create.useMutation({
    onSuccess: () => { utils.attendance.list.invalidate(); toast.success("Record added"); setDialogOpen(false); setForm({...defaultForm}); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.attendance.update.useMutation({
    onSuccess: () => { utils.attendance.list.invalidate(); toast.success("Record updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.attendance.delete.useMutation({
    onSuccess: () => { utils.attendance.list.invalidate(); toast.success("Record deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({...defaultForm, date:new Date().toISOString().split("T")[0]}); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ employeeId:String(r.employeeId), date:r.date||"", checkIn:r.checkIn||"", checkOut:r.checkOut||"", status:r.status||"present", delayMinutes:r.delayMinutes?String(r.delayMinutes):"", earlyLeaveMinutes:r.earlyLeaveMinutes?String(r.earlyLeaveMinutes):"", notes:r.notes||"" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = { ...form, employeeId:Number(form.employeeId), delayMinutes:form.delayMinutes?Number(form.delayMinutes):undefined, earlyLeaveMinutes:form.earlyLeaveMinutes?Number(form.earlyLeaveMinutes):undefined, checkIn:form.checkIn||undefined, checkOut:form.checkOut||undefined, notes:form.notes||undefined };
    if (editId) updateMutation.mutate({ id:editId, ...payload });
    else createMutation.mutate(payload);
  };

  const stats = { present:records.filter((r: any)=>r.status==="present").length, absent:records.filter((r: any)=>r.status==="absent").length, late:records.filter((r: any)=>r.status==="late").length, onLeave:records.filter((r: any)=>r.status==="on_leave").length };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("attendance.title")} subtitle={`${records.length} ${t("common.records")}`}
        actions={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={16}/>{t("attendance.add")}</Button>} />

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{label:t("attendance.present"),value:stats.present,color:"text-green-600"},{label:t("attendance.absent"),value:stats.absent,color:"text-red-500"},{label:t("attendance.late"),value:stats.late,color:"text-orange-500"},{label:t("attendance.onLeave"),value:stats.onLeave,color:"text-purple-500"}].map(s=>(
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={cn("text-2xl font-bold",s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-36 h-9 text-sm"/>
        <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-36 h-9 text-sm"/>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder={t("common.status")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {STATUSES.map(s=><SelectItem key={s} value={s}>{t(`attendance.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder={t("employees.title")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[t("employees.title"),t("attendance.date"),t("attendance.checkIn"),t("attendance.checkOut"),t("attendance.delay"),t("common.status"),t("common.actions")].map(h=>(
                  <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-slate-50">{Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>
              )) : records.length===0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
              ) : records.map((r: any)=>{
                const emp = employees.find((e: any)=>e.id===r.employeeId);
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp?`${emp.firstName} ${emp.lastName}`:`Emp #${r.employeeId}`}</td>
                    <td className="px-4 py-3 text-slate-600">{r.date}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkIn||"—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkOut||"—"}</td>
                    <td className="px-4 py-3 text-orange-500">{r.delayMinutes?`${r.delayMinutes} min`:"—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",`badge-${r.status}`)}>{t(`attendance.${r.status}`)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(r)}><Edit size={13}/></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={()=>deleteMutation.mutate({id:r.id})}><Trash2 size={13}/></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId?"Edit Record":t("attendance.add")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("employees.title")} *</Label>
              <Select value={form.employeeId} onValueChange={v=>setForm({...form,employeeId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>{employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("attendance.date")} *</Label>
              <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.status")}</Label>
              <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{t(`attendance.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("attendance.checkIn")}</Label>
              <Input type="time" value={form.checkIn} onChange={e=>setForm({...form,checkIn:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("attendance.checkOut")}</Label>
              <Input type="time" value={form.checkOut} onChange={e=>setForm({...form,checkOut:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("attendance.delay")} (min)</Label>
              <Input type="number" value={form.delayMinutes} onChange={e=>setForm({...form,delayMinutes:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("attendance.earlyLeave")} (min)</Label>
              <Input type="number" value={form.earlyLeaveMinutes} onChange={e=>setForm({...form,earlyLeaveMinutes:e.target.value})} className="h-8 text-sm"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending||updateMutation.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
