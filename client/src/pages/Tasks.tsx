import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { employeeName, localizedName } from "@/lib/i18n";
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
import { Plus, Edit, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITIES = ["low","medium","high","urgent"];
const STATUSES = ["pending","in_progress","completed","cancelled"];

const defaultForm = { title:"", description:"", assignedToId:"", branchId:"", priority:"medium", status:"pending", dueDate:"" };

export default function Tasks() {
  const { t, lang } = useLanguage();
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({...defaultForm});
  const utils = trpc.useUtils();

  const { data: tasks = [], isLoading } = trpc.task.list.useQuery({ status:statusFilter||undefined, priority:priorityFilter||undefined });
  const { data: employees = [] } = trpc.employee.list.useQuery({});
  const { data: branches = [] } = trpc.branch.list.useQuery();

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); toast.success("Task created"); setDialogOpen(false); setForm({...defaultForm}); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.task.update.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); toast.success("Task updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => { utils.task.list.invalidate(); toast.success("Task deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({...defaultForm}); setDialogOpen(true); };
  const openEdit = (task: any) => {
    setEditId(task.id);
    setForm({ title:task.title||"", description:task.description||"", assignedToId:task.assignedToId?String(task.assignedToId):"", branchId:task.branchId?String(task.branchId):"", priority:task.priority||"medium", status:task.status||"pending", dueDate:task.dueDate||"" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = { ...form, assignedToId:form.assignedToId?Number(form.assignedToId):undefined, branchId:form.branchId?Number(form.branchId):undefined, dueDate:form.dueDate||undefined };
    if (editId) updateMutation.mutate({ id:editId, ...payload });
    else createMutation.mutate(payload);
  };

  const quickStatus = (id: number, status: string) => updateMutation.mutate({ id, status } as any);

  const stats = {
    pending: tasks.filter((t: any)=>t.status==="pending").length,
    inProgress: tasks.filter((t: any)=>t.status==="in_progress").length,
    completed: tasks.filter((t: any)=>t.status==="completed").length,
    urgent: tasks.filter((t: any)=>t.priority==="urgent").length,
  };

  const priorityColors: Record<string,string> = { low:"bg-slate-100 text-slate-600", medium:"bg-[#F0F4F2] text-[#4A574F]", high:"bg-orange-50 text-orange-700", urgent:"bg-red-50 text-red-700" };
  const statusIcons: Record<string,any> = { pending:<Clock size={13} className="text-slate-500"/>, in_progress:<AlertCircle size={13} className="text-[#6D7B74]"/>, completed:<CheckCircle2 size={13} className="text-green-500"/>, cancelled:<Trash2 size={13} className="text-red-400"/> };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("tasks.title")} subtitle={`${tasks.length} ${t("common.total")}`}
        actions={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={16}/>{t("tasks.add")}</Button>} />

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[{label:t("tasks.pending"),value:stats.pending,color:"text-slate-600"},{label:t("tasks.inProgress"),value:stats.inProgress,color:"text-[#6D7B74]"},{label:t("tasks.completed"),value:stats.completed,color:"text-green-600"},{label:t("tasks.urgent"),value:stats.urgent,color:"text-red-600"}].map(s=>(
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={cn("text-2xl font-bold",s.color)}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder={t("common.status")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {STATUSES.map(s=><SelectItem key={s} value={s}>{t(`tasks.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder={t("tasks.priority")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {PRIORITIES.map(p=><SelectItem key={p} value={p}>{t(`tasks.${p}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {isLoading ? Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse"/>) :
        tasks.length===0 ? <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">{t("common.noData")}</div> :
        tasks.map((task: any)=>{
          const assignee = employees.find((e: any)=>e.id===task.assignedToId);
          const branch = branches.find((b: any)=>b.id===task.branchId);
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status!=="completed";
          return (
            <div key={task.id} className={cn("bg-white rounded-xl border border-slate-200 p-4", isOverdue&&"border-red-200 bg-red-50/30")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{statusIcons[task.status]||statusIcons.pending}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium text-slate-900 text-sm", task.status==="completed"&&"line-through text-slate-400")}>{task.title}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",priorityColors[task.priority||"medium"])}>{t(`tasks.${task.priority||"medium"}`)}</span>
                      {isOverdue && <span className="text-xs text-red-600 font-medium">⚠ {t("tasks.overdue")}</span>}
                    </div>
                    {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {assignee && <span>👤 {employeeName(lang,assignee)}</span>}
                      {branch && <span>🏢 {localizedName(lang,branch)}</span>}
                      {task.dueDate && <span className={cn(isOverdue&&"text-red-500")}>📅 {task.dueDate}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {task.status==="pending" && <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={()=>quickStatus(task.id,"in_progress")}>{t("tasks.start")}</Button>}
                  {task.status==="in_progress" && <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={()=>quickStatus(task.id,"completed")}>{t("tasks.complete")}</Button>}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(task)}><Edit size={13}/></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={()=>deleteMutation.mutate({id:task.id})}><Trash2 size={13}/></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId?"Edit Task":t("tasks.add")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("tasks.title")} *</Label>
              <Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.description")}</Label>
              <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className="text-sm resize-none"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("tasks.priority")}</Label>
                <Select value={form.priority} onValueChange={v=>setForm({...form,priority:v})}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p=><SelectItem key={p} value={p}>{t(`tasks.${p}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.status")}</Label>
                <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{t(`tasks.${s}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tasks.assignTo")}</Label>
                <Select value={form.assignedToId} onValueChange={v=>setForm({...form,assignedToId:v})}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..."/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("common.none")}</SelectItem>
                    {employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{employeeName(lang,e)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("tasks.dueDate")}</Label>
                <Input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="h-8 text-sm"/>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.branch")}</Label>
              <Select value={form.branchId} onValueChange={v=>setForm({...form,branchId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select branch..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {branches.map((b: any)=><SelectItem key={b.id} value={String(b.id)}>{localizedName(lang,b)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={!form.title||createMutation.isPending||updateMutation.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
