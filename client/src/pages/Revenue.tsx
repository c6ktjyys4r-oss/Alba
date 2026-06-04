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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";

const CATEGORIES = ["Services","Products","Consultation","Treatment","Other"];

const defaultForm = { branchId:"", category:"Services", description:"", amount:"", date:"", reference:"" };

export default function Revenue() {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState(new Date(Date.now()-30*86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [branchFilter, setBranchFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...defaultForm});
  const utils = trpc.useUtils();

  const { data: revenues = [], isLoading } = trpc.revenue.list.useQuery({ dateFrom, dateTo, branchId:branchFilter?Number(branchFilter):undefined });
  const { data: branches = [] } = trpc.branch.list.useQuery();

  const createMutation = trpc.revenue.create.useMutation({
    onSuccess: () => { utils.revenue.list.invalidate(); toast.success("Revenue added"); setDialogOpen(false); setForm({...defaultForm}); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.revenue.update.useMutation({
    onSuccess: () => { utils.revenue.list.invalidate(); toast.success("Revenue updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.revenue.delete.useMutation({
    onSuccess: () => { utils.revenue.list.invalidate(); toast.success("Revenue deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({...defaultForm, date:new Date().toISOString().split("T")[0]}); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ branchId:r.branchId?String(r.branchId):"", category:r.category||"Services", description:r.description||"", amount:String(r.amount||""), date:r.date||"", reference:r.reference||"" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = { ...form, amount:Number(form.amount), branchId:form.branchId?Number(form.branchId):undefined };
    if (editId) updateMutation.mutate({ id:editId, ...payload });
    else createMutation.mutate(payload);
  };

  const total = revenues.reduce((sum: number, r: any) => sum + Number(r.amount||0), 0);

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("accounting.revenue")} subtitle={`${revenues.length} ${t("common.records")}`}
        actions={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={16}/>{t("accounting.addRevenue")}</Button>} />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><TrendingUp size={18} className="text-green-600"/></div>
            <div>
              <p className="text-xs text-slate-500">{t("accounting.totalRevenue")}</p>
              <p className="text-xl font-bold text-green-600">{total.toLocaleString()} {t("common.currency")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp size={18} className="text-blue-600"/></div>
            <div>
              <p className="text-xs text-slate-500">{t("common.records")}</p>
              <p className="text-xl font-bold text-blue-600">{revenues.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-36 h-9 text-sm"/>
        <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-36 h-9 text-sm"/>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder={t("common.branch")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[t("accounting.date"),t("accounting.category"),t("accounting.description"),t("common.branch"),t("accounting.amount"),t("accounting.reference"),t("common.actions")].map(h=>(
                  <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-slate-50">{Array.from({length:7}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>
              )) : revenues.length===0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
              ) : revenues.map((r: any)=>{
                const branch = branches.find(b=>b.id===r.branchId);
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600">{r.date}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{r.category}</span></td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.description||"—"}</td>
                    <td className="px-4 py-3 text-slate-600">{branch?.name||"—"}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{Number(r.amount).toLocaleString()} {t("common.currency")}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.reference||"—"}</td>
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
          <DialogHeader><DialogTitle>{editId?"Edit Revenue":t("accounting.addRevenue")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("accounting.category")} *</Label>
              <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("accounting.amount")} *</Label>
              <Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("accounting.date")} *</Label>
              <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.branch")}</Label>
              <Select value={form.branchId} onValueChange={v=>setForm({...form,branchId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("accounting.description")}</Label>
              <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className="text-sm resize-none"/>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("accounting.reference")}</Label>
              <Input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} className="h-8 text-sm"/>
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
