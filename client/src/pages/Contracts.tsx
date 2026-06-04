import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = ["active","expired","pending_renewal","terminated"];

const defaultForm = { employeeId:"", contractType:"", startDate:"", endDate:"", status:"active", salary:"", notes:"" };

export default function Contracts() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...defaultForm});
  const utils = trpc.useUtils();

  const { data: contracts = [], isLoading } = trpc.contract.list.useQuery({ status: statusFilter||undefined });
  const { data: employees = [] } = trpc.employee.list.useQuery({});

  const createMutation = trpc.contract.create.useMutation({
    onSuccess: () => { utils.contract.list.invalidate(); toast.success("Contract created"); setDialogOpen(false); setForm({...defaultForm}); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.contract.update.useMutation({
    onSuccess: () => { utils.contract.list.invalidate(); toast.success("Contract updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.contract.delete.useMutation({
    onSuccess: () => { utils.contract.list.invalidate(); toast.success("Contract deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({...defaultForm}); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ employeeId:String(c.employeeId), contractType:c.contractType||"", startDate:c.startDate||"", endDate:c.endDate||"", status:c.status||"active", salary:c.salary?String(c.salary):"", notes:c.notes||"" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = { ...form, employeeId:Number(form.employeeId), salary:form.salary?Number(form.salary):undefined, endDate:form.endDate||undefined };
    if (editId) updateMutation.mutate({ id:editId, ...payload });
    else createMutation.mutate(payload);
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("contracts.title")} subtitle={`${contracts.length} ${t("common.total")}`}
        actions={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={16}/>{t("contracts.add")}</Button>} />

      <div className="flex gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder={t("common.status")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {STATUSES.map(s=><SelectItem key={s} value={s}>{t(`contracts.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[t("employees.title"),t("contracts.contractType"),t("contracts.startDate"),t("contracts.endDate"),t("contracts.salary"),t("common.status"),t("common.actions")].map(h=>(
                  <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}
                </tr>
              )) : contracts.length===0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
              ) : contracts.map((c: any)=>{
                const emp = employees.find((e: any)=>e.id===c.employeeId);
                const days = getDaysUntilExpiry(c.endDate);
                const isExpiringSoon = days !== null && days <= 30 && days > 0;
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${c.employeeId}`}</td>
                    <td className="px-4 py-3 text-slate-600">{c.contractType||"—"}</td>
                    <td className="px-4 py-3 text-slate-600">{c.startDate||"—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{c.endDate||"—"}</span>
                        {isExpiringSoon && <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle size={12}/>{days}d</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.salary ? `${Number(c.salary).toLocaleString()} ${t("common.currency")}` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",`badge-${c.status}`)}>{t(`contracts.${c.status}`)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(c)}><Edit size={13}/></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={()=>deleteMutation.mutate({id:c.id})}><Trash2 size={13}/></Button>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId?"Edit Contract":t("contracts.add")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("employees.title")} *</Label>
              <Select value={form.employeeId} onValueChange={v=>setForm({...form,employeeId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>{employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("contracts.contractType")}</Label>
              <Input value={form.contractType} onChange={e=>setForm({...form,contractType:e.target.value})} className="h-8 text-sm" placeholder="Full-time, Part-time..."/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("contracts.salary")}</Label>
              <Input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("contracts.startDate")} *</Label>
              <Input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("contracts.endDate")}</Label>
              <Input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("common.status")}</Label>
              <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{t(`contracts.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("common.notes")}</Label>
              <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="text-sm resize-none"/>
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
