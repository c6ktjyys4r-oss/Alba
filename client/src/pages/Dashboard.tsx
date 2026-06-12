import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  Users, FileText, Clock, TrendingUp, TrendingDown, Package,
  CheckSquare, AlertTriangle, DollarSign, Building2, BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

function StatCard({ title, value, icon, color, subtitle }: {
  title: string; value: string | number; icon: React.ReactNode;
  color: string; subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  const financialData = [
    { name: "Jan", revenue: 45000, expenses: 32000 },
    { name: "Feb", revenue: 52000, expenses: 35000 },
    { name: "Mar", revenue: 48000, expenses: 31000 },
    { name: "Apr", revenue: 61000, expenses: 38000 },
    { name: "May", revenue: 55000, expenses: 36000 },
    { name: "Jun", revenue: 67000, expenses: 41000 },
  ];

  const taskData = [
    { name: "Pending", value: 12, color: "#f59e0b" },
    { name: "In Progress", value: 8, color: "#3b82f6" },
    { name: "Completed", value: 25, color: "#10b981" },
    { name: "Overdue", value: stats?.overdueTasks || 0, color: "#ef4444" },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader title={t("dashboard.title")} subtitle={`${t("dashboard.welcome")}!`} />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("dashboard.totalEmployees")} value={stats?.totalEmployees || 0} icon={<Users size={18} className="text-white" />} color="bg-blue-500" />
        <StatCard title={t("dashboard.activeContracts")} value={stats?.activeContracts || 0} icon={<FileText size={18} className="text-white" />} color="bg-emerald-500" subtitle={`${stats?.expiringContracts || 0} ${t("dashboard.expiringContracts")}`} />
        <StatCard title={t("dashboard.todayAttendance")} value={stats?.todayAttendance || 0} icon={<Clock size={18} className="text-white" />} color="bg-violet-500" subtitle={`${stats?.lateToday || 0} ${t("dashboard.lateArrivals")}`} />
        <StatCard title={t("dashboard.openTasks")} value={stats?.openTasks || 0} icon={<CheckSquare size={18} className="text-white" />} color="bg-amber-500" subtitle={`${stats?.overdueTasks || 0} ${t("dashboard.overdueTasks")}`} />
        <StatCard title={t("dashboard.totalRevenue")} value={`${(stats?.monthRevenue || 0).toLocaleString()} ${t("common.currency")}`} icon={<TrendingUp size={18} className="text-white" />} color="bg-green-500" subtitle="This month" />
        <StatCard title={t("dashboard.totalExpenses")} value={`${(stats?.monthExpenses || 0).toLocaleString()} ${t("common.currency")}`} icon={<TrendingDown size={18} className="text-white" />} color="bg-red-500" subtitle="This month" />
        <StatCard title={t("dashboard.netProfit")} value={`${(stats?.netProfit || 0).toLocaleString()} ${t("common.currency")}`} icon={<DollarSign size={18} className="text-white" />} color={stats?.netProfit && stats.netProfit >= 0 ? "bg-teal-500" : "bg-red-500"} />
        <StatCard title={t("dashboard.lowStockAlerts")} value={stats?.lowStockCount || 0} icon={<AlertTriangle size={18} className="text-white" />} color="bg-orange-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">{t("accounting.revenueVsExpenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={financialData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">{t("nav.tasks")} Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={taskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {taskData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Alerts */}
      {(stats?.expiringContracts || 0) > 0 || (stats?.lowStockCount || 0) > 0 || (stats?.overdueTasks || 0) > 0 ? (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Alerts & Notifications
            </h3>
            <div className="space-y-2">
              {(stats?.expiringContracts || 0) > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  <FileText size={14} />
                  {stats?.expiringContracts} contract(s) expiring within 30 days
                </div>
              )}
              {(stats?.lowStockCount || 0) > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-lg">
                  <Package size={14} />
                  {stats?.lowStockCount} inventory item(s) below minimum stock level
                </div>
              )}
              {(stats?.overdueTasks || 0) > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                  <CheckSquare size={14} />
                  {stats?.overdueTasks} task(s) are overdue
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
