import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Financial() {
  const { t } = useLanguage();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [branchFilter, setBranchFilter] = useState("");

  const { data: revenues = [] } = trpc.revenue.list.useQuery({ dateFrom:`${year}-01-01`, dateTo:`${year}-12-31`, branchId:branchFilter?Number(branchFilter):undefined });
  const { data: expenses = [] } = trpc.expense.list.useQuery({ dateFrom:`${year}-01-01`, dateTo:`${year}-12-31`, branchId:branchFilter?Number(branchFilter):undefined });
  const { data: branches = [] } = trpc.branch.list.useQuery();

  const totalRevenue = revenues.reduce((s: number, r: any) => s + Number(r.amount||0), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount||0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  // Monthly aggregation
  const monthlyData = MONTHS.map((month, idx) => {
    const m = String(idx + 1).padStart(2, "0");
    const rev = revenues.filter((r: any) => r.date?.startsWith(`${year}-${m}`)).reduce((s: number, r: any) => s + Number(r.amount||0), 0);
    const exp = expenses.filter((e: any) => e.date?.startsWith(`${year}-${m}`)).reduce((s: number, e: any) => s + Number(e.amount||0), 0);
    return { month, revenue: rev, expenses: exp, profit: rev - exp };
  });

  // Category breakdown
  const revByCategory: Record<string, number> = {};
  revenues.forEach((r: any) => { revByCategory[r.category] = (revByCategory[r.category]||0) + Number(r.amount||0); });
  const expByCategory: Record<string, number> = {};
  expenses.forEach((e: any) => { expByCategory[e.category] = (expByCategory[e.category]||0) + Number(e.amount||0); });

  const revCatData = Object.entries(revByCategory).map(([name, value]) => ({ name, value }));
  const expCatData = Object.entries(expByCategory).map(([name, value]) => ({ name, value }));

  const COLORS = ["#6D7B74","#C1CDC7","#E5B6A6","#7C6E6C","#97A8A0","#B5705E","#B08A4A"];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <PageHeader title={t("accounting.financial")} subtitle={`${t("common.year")} ${year}`}
        actions={
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24 h-9 text-sm"><SelectValue/></SelectTrigger>
              <SelectContent>{[2024,2025,2026].map(y=><SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder={t("common.branch")}/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:t("accounting.totalRevenue"), value:totalRevenue, color:"text-green-600", bg:"bg-green-50", icon:<TrendingUp size={18} className="text-green-600"/> },
          { label:t("accounting.totalExpenses"), value:totalExpenses, color:"text-red-600", bg:"bg-red-50", icon:<TrendingDown size={18} className="text-red-600"/> },
          { label:t("accounting.netProfit"), value:netProfit, color:netProfit>=0?"text-[#6D7B74]":"text-red-600", bg:"bg-[#F0F4F2]", icon:<DollarSign size={18} className="text-[#6D7B74]"/> },
          { label:t("accounting.profitMargin"), value:`${profitMargin}%`, color:"text-[#7C6E6C]", bg:"bg-[#F2ECEA]", icon:<BarChart3 size={18} className="text-[#7C6E6C]"/> },
        ].map(card=>(
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>{card.icon}</div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>{typeof card.value === "number" ? card.value.toLocaleString() : card.value} {typeof card.value === "number" ? t("common.currency") : ""}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-700">{t("accounting.monthlyOverview")}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:"8px",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}/>
              <Legend wrapperStyle={{fontSize:"12px"}}/>
              <Bar dataKey="revenue" fill="#6D7B74" radius={[4,4,0,0]} name="Revenue"/>
              <Bar dataKey="expenses" fill="#E5B6A6" radius={[4,4,0,0]} name="Expenses"/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit Line */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-700">{t("accounting.profitTrend")}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:"8px",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}/>
              <Line type="monotone" dataKey="profit" stroke="#7C6E6C" strokeWidth={2} dot={{r:4}} name="Net Profit"/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-700">{t("accounting.revenueByCategory")}</CardTitle></CardHeader>
          <CardContent>
            {revCatData.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revCatData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {revCatData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-700">{t("accounting.expensesByCategory")}</CardTitle></CardHeader>
          <CardContent>
            {expCatData.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">{t("common.noData")}</p> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expCatData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {expCatData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
