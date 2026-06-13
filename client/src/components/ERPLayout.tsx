import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  Package,
  CheckSquare,
  PieChart,
  Bot,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Globe,
  LogOut,
  User,
  ChevronLeft,
  Bell,
  PlusCircle,
  KeyRound,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AlbaLogo, { AlbaMark } from "@/components/AlbaLogo";

interface NavItem {
  key?: string;
  label?: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  badge?: number;
}

const adminNavItems: NavItem[] = [
  { key: "nav.dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
  {
    key: "nav.hr",
    icon: <Users size={18} />,
    children: [
      { key: "nav.employees", icon: <Users size={16} />, path: "/employees" },
      { key: "nav.contracts", icon: <FileText size={16} />, path: "/contracts" },
      { key: "nav.payroll", icon: <DollarSign size={16} />, path: "/payroll" },
      { key: "nav.attendance", icon: <Clock size={16} />, path: "/attendance" },
    ],
  },
  {
    key: "nav.accounting",
    icon: <TrendingUp size={18} />,
    children: [
      { key: "nav.revenue", icon: <TrendingUp size={16} />, path: "/revenue" },
      { key: "nav.expenses", icon: <TrendingDown size={16} />, path: "/expenses" },
      { key: "nav.financial", icon: <BarChart3 size={16} />, path: "/financial" },
    ],
  },
  { key: "nav.branches", icon: <Building2 size={18} />, path: "/branches" },
  { key: "nav.inventory", icon: <Package size={18} />, path: "/inventory" },
  { key: "nav.tasks", icon: <CheckSquare size={18} />, path: "/tasks" },
  { key: "nav.reports", icon: <PieChart size={18} />, path: "/reports" },
  { key: "nav.ai", icon: <Bot size={18} />, path: "/ai-assistant" },
  { key: "nav.import", icon: <FileText size={18} />, path: "/import-data" },
];

function NavItemComponent({
  item,
  depth = 0,
  collapsed,
}: {
  item: NavItem;
  depth?: number;
  collapsed: boolean;
}) {
  const { t, isRTL } = useLanguage();
  const [location] = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((c) => c.path === location);
    }
    return false;
  });

  const isActive = item.path === location;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const label = item.label ?? (item.key ? t(item.key) : "");

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            open && "bg-slate-100 text-slate-900",
            collapsed && "justify-center px-2"
          )}
        >
          <span className="flex-shrink-0 text-slate-500">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-start">{label}</span>
              <span className={cn("transition-transform", open && "rotate-90")}>
                <ChevronIcon size={14} />
              </span>
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className={cn("mt-1 space-y-0.5", isRTL ? "pr-4" : "pl-4")}>
            {item.children.map((child) => (
              <NavItemComponent key={child.path ?? child.key ?? child.label} item={child} depth={depth + 1} collapsed={collapsed} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.path!}>
      <a
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          collapsed && "justify-center px-2"
        )}
      >
        <span className={cn("flex-shrink-0", isActive ? "text-primary-foreground" : "text-slate-500")}>
          {item.icon}
        </span>
        {!collapsed && <span className="flex-1">{label}</span>}
        {!collapsed && item.badge != null && item.badge > 0 && (
          <span className="bg-red-500 text-white text-[10px] rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </a>
    </Link>
  );
}

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const hasEmployee = Boolean(user?.employeeId);
  const isSuperAdmin = user?.role === "super_admin";

  // Notification badge — only meaningful for users backed by an employee record.
  const { data: notifications } = trpc.empPortal.myNotifications.useQuery(undefined, {
    retry: false,
    refetchInterval: 30000,
    enabled: hasEmployee,
  });
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const personalNavItems: NavItem[] = hasEmployee
    ? [
        { label: "My Dashboard", icon: <LayoutDashboard size={18} />, path: "/emp" },
        { label: "Attendance", icon: <Clock size={18} />, path: "/emp/attendance" },
        { label: "My Requests", icon: <ClipboardList size={18} />, path: "/emp/requests" },
        { label: "New Request", icon: <PlusCircle size={18} />, path: "/emp/requests/new" },
        { label: "Notifications", icon: <Bell size={18} />, path: "/emp/notifications", badge: unread },
        ...(user?.isManager
          ? [{ label: "Approvals", icon: <ClipboardCheck size={18} />, path: "/emp/manager" }]
          : []),
        { label: "Change Password", icon: <KeyRound size={18} />, path: "/emp/change-password" },
      ]
    : [];

  const isBranchManager = user?.role === "branch_manager";
  const branchNavItems: NavItem[] = isBranchManager
    ? [
        { label: "Employees", icon: <Users size={18} />, path: "/branch/employees" },
        { label: "Departments", icon: <Building2 size={18} />, path: "/branch/departments" },
        { label: "Attendance", icon: <Clock size={18} />, path: "/branch/attendance" },
        { label: "Payroll", icon: <DollarSign size={18} />, path: "/branch/payroll" },
        { label: "Reports", icon: <PieChart size={18} />, path: "/branch/reports" },
      ]
    : [];

  const navGroups: { title: string; items: NavItem[] }[] = [
    ...(personalNavItems.length ? [{ title: "Personal", items: personalNavItems }] : []),
    ...(branchNavItems.length ? [{ title: "Branch", items: branchNavItems }] : []),
    ...(isSuperAdmin ? [{ title: "Administration", items: adminNavItems }] : []),
  ];

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className={cn("flex h-screen bg-background overflow-hidden", isRTL && "font-arabic")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 z-40 flex flex-col bg-white border-e border-slate-200 transition-all duration-300",
          isRTL ? "right-0" : "left-0",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center px-4 py-4 border-b border-slate-200", collapsed ? "justify-center px-2" : "gap-3")}>
          {collapsed ? (
            <AlbaMark className="h-8 w-auto text-primary" />
          ) : (
            <AlbaLogo />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <NavItemComponent
                  key={item.path ?? item.key ?? item.label}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {collapsed ? (
              isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
            ) : (
              <>
                {isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                {!collapsed && <span className="text-xs">Collapse</span>}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="gap-2 text-xs"
            >
              <Globe size={14} />
              {lang === "en" ? "العربية" : "English"}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-[#E7ECE9] text-[#4A574F]">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name || "User"}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
                <DropdownMenuItem className="gap-2">
                  <User size={14} />
                  {t("auth.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600" onClick={handleLogout}>
                  <LogOut size={14} />
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
