import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
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
              <span className="flex-1 text-start">{t(item.key)}</span>
              <span className={cn("transition-transform", open && "rotate-90")}>
                <ChevronIcon size={14} />
              </span>
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className={cn("mt-1 space-y-0.5", isRTL ? "pr-4" : "pl-4")}>
            {item.children.map((child) => (
              <NavItemComponent key={child.key} item={child} depth={depth + 1} collapsed={collapsed} />
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
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          collapsed && "justify-center px-2"
        )}
      >
        <span className={cn("flex-shrink-0", isActive ? "text-white" : "text-slate-500")}>
          {item.icon}
        </span>
        {!collapsed && <span>{t(item.key)}</span>}
      </a>
    </Link>
  );
}

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className={cn("flex h-screen bg-slate-50 overflow-hidden", isRTL && "font-arabic")} dir={isRTL ? "rtl" : "ltr"}>
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
        <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-slate-200", collapsed && "justify-center px-2")}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">ERP System</p>
              <p className="text-xs text-slate-500">Management Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.key} item={item} collapsed={collapsed} />
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
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{initials}</AvatarFallback>
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
                <DropdownMenuItem className="gap-2 text-red-600" onClick={logout}>
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
