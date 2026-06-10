import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, DollarSign, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Payroll() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("records");
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth()+1));
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [salaryForm, setSalaryForm] = useState({ basicSalary:"", housingAllowance:"", transportAllowance:"", otherAllowances:"", gosiPercentage:"0", otherDeductions:"", currency:"SAR" });
  const [genForm, setGenForm] = useState({ employeeId:"", bonus:"", notes:"" });
  const utils = trpc.useUtils();

  const { data: payroll = [], isLoading } = trpc.payroll.list.useQuery({ month: Number(monthFilter), year: Number(yearFilter) });
  const { data: employees = [] } = trpc.employee.list.useQuery({});
  const { data: salaryStructure } = trpc.payroll.getSalaryStructure.useQuery({ employeeId: Number(selectedEmpId) }, { enabled: !!selectedEmpId });

  const upsertSalary = trpc.payroll.upsertSalaryStructure.useMutation({
    onSuccess: () => { toast.success("Salary structure saved"); setSalaryDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const generatePayroll = trpc.payroll.generate.useMutation({
    onSuccess: () => { utils.payroll.list.invalidate(); toast.success("Payroll generated"); setGenerateDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = trpc.payroll.updateStatus.useMutation({
    onSuccess: () => { utils.payroll.list.invalidate(); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const openSalaryDialog = (empId: string) => {
    setSelectedEmpId(empId);
    if (salaryStructure) {
      setSalaryForm({ basicSalary:String(salaryStructure.basicSalary||""), housingAllowance:String(salaryStructure.housingAllowance||""), transportAllowance:String(salaryStructure.transportAllowance||""), otherAllowances:String(salaryStructure.otherAllowances||""), gosiPercentage:String(salaryStructure.taxDeduction||"0"), otherDeductions:String(salaryStructure.otherDeductions||""), currency:salaryStructure.currency||"SAR" });
    }
    setSalaryDialogOpen(true);
  };

  const totalPayroll = payroll.reduce((sum: number, p: any) => sum + Number(p.netSalary||0), 0);

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("payroll.title")} subtitle={`${MONTHS[Number(monthFilter)-1]} ${yearFilter}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={()=>setSalaryDialogOpen(true)} className="gap-2"><DollarSign size={14}/>{t("payroll.salaryStructure")}</Button>
            <Button size="sm" onClick={()=>setGenerateDialogOpen(true)} className="gap-2"><Plus size={16}/>{t("payroll.generate")}</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">{t("payroll.totalPayroll")}</p>
            <p className="text-xl font-bold text-slate-900">{totalPayroll.toLocaleString()} {t("common.currency")}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">{t("payroll.totalRecords")}</p>
            <p className="text-xl font-bold text-slate-900">{payroll.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">{t("payroll.paid")}</p>
            <p className="text-xl font-bold text-green-600">{payroll.filter((p: any)=>p.status==="paid").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-32 h-9 text-sm"><SelectValue/></SelectTrigger>
          <SelectContent>{MONTHS.map((m,i)=><SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-28 h-9 text-sm"><SelectValue/></SelectTrigger>
          <SelectContent>{[2024,2025,2026].map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[t("employees.title"),t("payroll.basicSalary"),t("payroll.allowances"),t("payroll.deductions"),t("payroll.bonus"),t("payroll.netSalary"),t("common.status"),t("common.actions")].map(h=>(
                  <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({length:4}).map((_,i)=>(
                <tr key={i} className="border-b border-slate-50">{Array.from({length:8}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>
              )) : payroll.length===0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
              ) : payroll.map((p: any)=>{
                const emp = employees.find((e: any)=>e.id===p.employeeId);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp?`${emp.firstName} ${emp.lastName}`:`Emp #${p.employeeId}`}</td>
                    <td className="px-4 py-3 text-slate-600">{Number(p.basicSalary||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">+{Number(p.totalAllowances||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500">-{Number(p.totalDeductions||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-blue-600">{Number(p.bonus||0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{Number(p.netSalary||0).toLocaleString()} {t("common.currency")}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",`badge-${p.status}`)}>{t(`payroll.${p.status}`)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {p.status==="draft" && <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={()=>updateStatus.mutate({id:p.id,status:"approved"})}>{t("payroll.approve")}</Button>}
                        {p.status==="approved" && <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={()=>updateStatus.mutate({id:p.id,status:"paid"})}>{t("payroll.markPaid")}</Button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Structure Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t("payroll.salaryStructure")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("employees.title")}</Label>
              <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>{employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {key:"basicSalary",label:t("payroll.basicSalary")},
                {key:"housingAllowance",label:t("payroll.housingAllowance")},
                {key:"transportAllowance",label:t("payroll.transportAllowance")},
                {key:"otherAllowances",label:t("payroll.otherAllowances")},
                {key:"otherDeductions",label:t("payroll.otherDeductions")},
              ].map(({key,label})=>(
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Input type="number" value={(salaryForm as any)[key]} onChange={e=>setSalaryForm({...salaryForm,[key]:e.target.value})} className="h-8 text-sm"/>
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">GOSI Percentage / نسبة التأمينات</Label>
                <Select value={salaryForm.gosiPercentage} onValueChange={v=>setSalaryForm({...salaryForm,gosiPercentage:v})}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="9.75">9.75%</SelectItem>
                    <SelectItem value="10.25">10.25%</SelectItem>
                    <SelectItem value="10.75">10.75%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {Number(salaryForm.gosiPercentage) > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">GOSI Amount / مبلغ التأمينات</Label>
                  <div className="h-8 text-sm flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                    {Math.round((Number(salaryForm.basicSalary) + Number(salaryForm.housingAllowance)) * Number(salaryForm.gosiPercentage)) / 100} SAR
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setSalaryDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={()=>upsertSalary.mutate({ employeeId:Number(selectedEmpId), basicSalary:Number(salaryForm.basicSalary), housingAllowance:Number(salaryForm.housingAllowance), transportAllowance:Number(salaryForm.transportAllowance), otherAllowances:Number(salaryForm.otherAllowances), taxDeduction:Number(salaryForm.gosiPercentage), otherDeductions:Number(salaryForm.otherDeductions), currency:salaryForm.currency })} disabled={!selectedEmpId||upsertSalary.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payroll Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t("payroll.generate")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("employees.title")} *</Label>
              <Select value={genForm.employeeId} onValueChange={v=>setGenForm({...genForm,employeeId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select employee"/></SelectTrigger>
                <SelectContent>{employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("payroll.bonus")}</Label>
              <Input type="number" value={genForm.bonus} onChange={e=>setGenForm({...genForm,bonus:e.target.value})} className="h-8 text-sm"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setGenerateDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={()=>generatePayroll.mutate({ employeeId:Number(genForm.employeeId), month:Number(monthFilter), year:Number(yearFilter), bonus:genForm.bonus?Number(genForm.bonus):undefined })} disabled={!genForm.employeeId||generatePayroll.isPending}>{t("payroll.generate")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
