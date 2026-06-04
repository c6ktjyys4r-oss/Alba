import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, Users, DollarSign, Package, CheckSquare } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

export default function Reports() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("hr");
  const [dateFrom, setDateFrom] = useState(new Date(Date.now()-30*86400000).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [branchFilter, setBranchFilter] = useState("");

  const { data: employees = [] } = trpc.employee.list.useQuery({});
  const { data: attendance = [] } = trpc.attendance.list.useQuery({ dateFrom, dateTo, employeeId:undefined });
  const { data: revenues = [] } = trpc.revenue.list.useQuery({ dateFrom, dateTo, branchId:branchFilter?Number(branchFilter):undefined });
  const { data: expenses = [] } = trpc.expense.list.useQuery({ dateFrom, dateTo, branchId:branchFilter?Number(branchFilter):undefined });
  const { data: tasks = [] } = trpc.task.list.useQuery({});
  const { data: inventory = [] } = trpc.inventory.list.useQuery({});
  const { data: branches = [] } = trpc.branch.list.useQuery();
  const { data: payroll = [] } = trpc.payroll.list.useQuery({ month: new Date().getMonth()+1, year: new Date().getFullYear() });

  // HR Stats
  const empByDept: Record<string,number> = {};
  employees.forEach((e: any) => { const k = e.departmentId||"Unassigned"; empByDept[k] = (empByDept[k]||0)+1; });
  const empByStatus: Record<string,number> = {};
  employees.forEach((e: any) => { const k = e.status||"active"; empByStatus[k] = (empByStatus[k]||0)+1; });

  const attendanceStats = {
    present: attendance.filter((a: any)=>a.status==="present").length,
    absent: attendance.filter((a: any)=>a.status==="absent").length,
    late: attendance.filter((a: any)=>a.status==="late").length,
    onLeave: attendance.filter((a: any)=>a.status==="on_leave").length,
  };
  const attendancePie = Object.entries(attendanceStats).map(([name,value])=>({name:t(`attendance.${name}`),value})).filter(d=>d.value>0);

  // Financial Stats
  const totalRev = revenues.reduce((s: number, r: any)=>s+Number(r.amount||0),0);
  const totalExp = expenses.reduce((s: number, e: any)=>s+Number(e.amount||0),0);

  const revByBranch: Record<string,number> = {};
  revenues.forEach((r: any) => { const b = branches.find((b: any)=>b.id===r.branchId); const k = b?.name||"Other"; revByBranch[k]=(revByBranch[k]||0)+Number(r.amount||0); });
  const revBranchData = Object.entries(revByBranch).map(([name,value])=>({name,value}));

  // Task Stats
  const taskByStatus: Record<string,number> = {};
  tasks.forEach((t: any) => { taskByStatus[t.status]=(taskByStatus[t.status]||0)+1; });
  const taskPie = Object.entries(taskByStatus).map(([name,value])=>({name:t(`tasks.${name}`),value}));

  // Inventory Stats
  const lowStock = inventory.filter((i: any)=>Number(i.quantity)<=Number(i.minimumStock)).length;
  const totalValue = inventory.reduce((s: number, i: any)=>s+Number(i.quantity||0)*Number(i.unitCost||0),0);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row=>Object.values(row).map(v=>JSON.stringify(v)).join(",")).join("\n");
    const blob = new Blob([headers+"\n"+rows], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")}
        actions={
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-36 h-9 text-sm"/>
            <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-36 h-9 text-sm"/>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder={t("common.branch")}/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {branches.map((b: any)=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {icon:<Users size={18} className="text-blue-600"/>,bg:"bg-blue-50",label:t("employees.title"),value:employees.length,sub:`${empByStatus["active"]||0} ${t("employees.active")}`},
          {icon:<DollarSign size={18} className="text-green-600"/>,bg:"bg-green-50",label:t("accounting.netProfit"),value:`${(totalRev-totalExp).toLocaleString()} ${t("common.currency")}`,sub:`Rev: ${totalRev.toLocaleString()} | Exp: ${totalExp.toLocaleString()}`},
          {icon:<Package size={18} className="text-amber-600"/>,bg:"bg-amber-50",label:t("inventory.title"),value:inventory.length,sub:`${lowStock} ${t("inventory.lowStock")}`},
          {icon:<CheckSquare size={18} className="text-violet-600"/>,bg:"bg-violet-50",label:t("tasks.title"),value:tasks.length,sub:`${taskByStatus["completed"]||0} ${t("tasks.completed")}`},
        ].map(card=>(
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>{card.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-base font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-400">{card.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="hr">{t("hr.title")}</TabsTrigger>
          <TabsTrigger value="financial">{t("accounting.title")}</TabsTrigger>
          <TabsTrigger value="tasks">{t("tasks.title")}</TabsTrigger>
          <TabsTrigger value="inventory">{t("inventory.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="hr" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={()=>exportCSV(employees,"employees-report")}><Download size={14}/>{t("reports.export")}</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("employees.title")} {t("common.status")}</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(empByStatus).length===0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={Object.entries(empByStatus).map(([name,value])=>({name,value}))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                        {Object.keys(empByStatus).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("attendance.title")} ({dateFrom} - {dateTo})</CardTitle></CardHeader>
              <CardContent>
                {attendancePie.length===0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={attendancePie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                        {attendancePie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t("payroll.title")} {t("common.summary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-xl font-bold text-slate-900">{payroll.length}</p>
                  <p className="text-xs text-slate-500">{t("payroll.totalRecords")}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{payroll.filter((p: any)=>p.status==="paid").length}</p>
                  <p className="text-xs text-slate-500">{t("payroll.paid")}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{payroll.reduce((s: number, p: any)=>s+Number(p.netSalary||0),0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{t("payroll.totalPayroll")} ({t("common.currency")})</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={()=>exportCSV([...revenues.map((r: any)=>({...r,type:"revenue"})),...expenses.map((e: any)=>({...e,type:"expense"}))],"financial-report")}><Download size={14}/>{t("reports.export")}</Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("accounting.revenueByBranch")}</CardTitle></CardHeader>
            <CardContent>
              {revBranchData.length===0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revBranchData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
                    <Tooltip/>
                    <Bar dataKey="value" fill="#10b981" radius={[4,4,0,0]} name="Revenue"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={()=>exportCSV(tasks,"tasks-report")}><Download size={14}/>{t("reports.export")}</Button>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("tasks.title")} {t("common.status")}</CardTitle></CardHeader>
            <CardContent>
              {taskPie.length===0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={taskPie} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                      {taskPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={()=>exportCSV(inventory,"inventory-report")}><Download size={14}/>{t("reports.export")}</Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-900">{inventory.length}</p><p className="text-xs text-slate-500">{t("common.total")} {t("inventory.items")}</p></CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{lowStock}</p><p className="text-xs text-slate-500">{t("inventory.lowStock")}</p></CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{totalValue.toLocaleString()}</p><p className="text-xs text-slate-500">{t("inventory.totalValue")} ({t("common.currency")})</p></CardContent></Card>
          </div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("inventory.lowStockAlert")}</CardTitle></CardHeader>
            <CardContent>
              {inventory.filter((i: any)=>Number(i.quantity)<=Number(i.minimumStock)).length===0 ? (
                <p className="text-sm text-green-600 text-center py-4">✓ {t("inventory.allStockOk")}</p>
              ) : (
                <div className="space-y-2">
                  {inventory.filter((i: any)=>Number(i.quantity)<=Number(i.minimumStock)).map((item: any)=>(
                    <div key={item.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-sm">
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="text-red-600 font-semibold">{item.quantity} / {item.minimumStock} {item.unit||""}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
