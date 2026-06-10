import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = ["super_admin","hr_manager","accountant","branch_manager","inventory_officer","department_manager","employee"];
const STATUSES = ["active","inactive","on_leave","terminated"];
const GENDERS = ["male","female","other"];

const defaultForm = {
  firstName:"",lastName:"",firstNameAr:"",lastNameAr:"",email:"",phone:"",
  nationalId:"",dateOfBirth:"",gender:"",nationality:"",address:"",
  branchId:"",departmentId:"",jobTitle:"",jobTitleAr:"",erpRole:"employee",
  hireDate:"",status:"active",employeeCode:"",
};

export default function Employees() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const utils = trpc.useUtils();

  const { data: employees = [], isLoading } = trpc.employee.list.useQuery({ search, status: statusFilter==="all"?undefined:statusFilter, branchId: branchFilter&&branchFilter!=="all" ? Number(branchFilter) : undefined });
  const { data: branches = [] } = trpc.branch.list.useQuery();
  const { data: departments = [] } = trpc.department.list.useQuery();

  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); toast.success("Employee created"); setDialogOpen(false); setForm({...defaultForm}); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.employee.update.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); toast.success("Employee updated"); setDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); toast.success("Employee deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditId(null); setForm({...defaultForm}); setDialogOpen(true); };
  const openEdit = (emp: any) => {
    setEditId(emp.id);
    setForm({ firstName:emp.firstName||"",lastName:emp.lastName||"",firstNameAr:emp.firstNameAr||"",lastNameAr:emp.lastNameAr||"",email:emp.email||"",phone:emp.phone||"",nationalId:emp.nationalId||"",dateOfBirth:emp.dateOfBirth||"",gender:emp.gender||"",nationality:emp.nationality||"",address:emp.address||"",branchId:emp.branchId?String(emp.branchId):"",departmentId:emp.departmentId?String(emp.departmentId):"",jobTitle:emp.jobTitle||"",jobTitleAr:emp.jobTitleAr||"",erpRole:emp.erpRole||"employee",hireDate:emp.hireDate||"",status:emp.status||"active",employeeCode:emp.employeeCode||"" });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: any = { ...form, branchId:form.branchId?Number(form.branchId):undefined, departmentId:form.departmentId?Number(form.departmentId):undefined, gender:form.gender||undefined, dateOfBirth:form.dateOfBirth||undefined, hireDate:form.hireDate||undefined, employeeCode:form.employeeCode||undefined };
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("employees.title")} subtitle={`${employees.length} ${t("common.total")}`}
        actions={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={16}/>{t("employees.add")}</Button>} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder={t("common.search")} value={search} onChange={(e)=>setSearch(e.target.value)} className="ps-9 h-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder={t("common.status")}/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {STATUSES.map(s=><SelectItem key={s} value={s}>{t(`employees.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
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
                {[t("employees.title"),t("employees.jobTitle"),t("common.branch"),t("employees.erpRole"),t("common.status"),t("common.actions")].map(h=>(
                  <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({length:6}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}
                </tr>
              )) : employees.length===0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
              ) : employees.map((emp: any)=>{
                const branch = branches.find(b=>b.id===emp.branchId);
                const initials = `${emp.firstName?.[0]||""}${emp.lastName?.[0]||""}`.toUpperCase();
                return (
                  <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8"><AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-400">{emp.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{emp.jobTitle||"—"}</td>
                    <td className="px-4 py-3 text-slate-600">{branch?.name||"—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t(`role.${emp.erpRole}`)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",`badge-${emp.status}`)}>{t(`employees.${emp.status}`)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(emp)}><Edit size={13}/></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={()=>deleteMutation.mutate({id:emp.id})}><Trash2 size={13}/></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId?t("employees.edit"):t("employees.add")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {[
              {key:"firstName",label:t("employees.firstName"),req:true},{key:"lastName",label:t("employees.lastName"),req:true},
              {key:"firstNameAr",label:`${t("employees.firstName")} (AR)`},{key:"lastNameAr",label:`${t("employees.lastName")} (AR)`},
              {key:"email",label:t("common.email")},{key:"phone",label:t("common.phone")},
              {key:"nationalId",label:t("employees.nationalId")},{key:"employeeCode",label:t("employees.employeeCode")},
              {key:"jobTitle",label:t("employees.jobTitle")},{key:"jobTitleAr",label:`${t("employees.jobTitle")} (AR)`},
              {key:"nationality",label:t("employees.nationality")},
              {key:"hireDate",label:t("employees.hireDate"),type:"date"},{key:"dateOfBirth",label:t("employees.dateOfBirth"),type:"date"},
            ].map(({key,label,req,type})=>(
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}{req&&" *"}</Label>
                <Input type={type||"text"} value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="h-8 text-sm"/>
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">{t("employees.gender")}</Label>
              <Select value={form.gender} onValueChange={v=>setForm({...form,gender:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{GENDERS.map(g=><SelectItem key={g} value={g}>{t(`employees.${g}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.status")}</Label>
              <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{t(`employees.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("employees.erpRole")}</Label>
              <Select value={form.erpRole} onValueChange={v=>setForm({...form,erpRole:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{ROLES.map(r=><SelectItem key={r} value={r}>{t(`role.${r}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.branch")}</Label>
              <Select value={form.branchId} onValueChange={v=>setForm({...form,branchId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.all")}</SelectItem>
                  {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.department")}</Label>
              <Select value={form.departmentId} onValueChange={v=>setForm({...form,departmentId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.all")}</SelectItem>
                  {departments.map(d=><SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("employees.address")}</Label>
              <Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="h-8 text-sm"/>
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
