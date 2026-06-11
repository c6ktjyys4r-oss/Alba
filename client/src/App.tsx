import { Toaster } from "@/components/ui/sonner";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/NotFound";
  import LoginPage from "@/pages/Login";
  import { Route, Switch, useLocation } from "wouter";
  import ErrorBoundary from "./components/ErrorBoundary";
  import { ThemeProvider } from "./contexts/ThemeContext";
  import { LanguageProvider } from "./contexts/LanguageContext";
  import ERPLayout from "./components/ERPLayout";
  import { useAuth } from "./_core/hooks/useAuth";
  import { trpc } from "@/lib/trpc";

  // ERP Pages
  import Dashboard from "./pages/Dashboard";
  import Employees from "./pages/Employees";
  import Contracts from "./pages/Contracts";
  import Payroll from "./pages/Payroll";
  import Attendance from "./pages/Attendance";
  import Revenue from "./pages/Revenue";
  import Expenses from "./pages/Expenses";
  import Financial from "./pages/Financial";
  import Branches from "./pages/Branches";
  import Inventory from "./pages/Inventory";
  import Tasks from "./pages/Tasks";
  import Reports from "./pages/Reports";
  import AIAssistant from "./pages/AIAssistant";
  import ImportData from "./pages/ImportData";
  import BranchDetails from "./pages/BranchDetails";
  import EmployeeProfile from "./pages/EmployeeProfile";

  // Employee Self-Service Portal
  import PortalLogin from "./pages/emp/PortalLogin";
  import PortalDashboard from "./pages/emp/PortalDashboard";
  import PortalRequests from "./pages/emp/PortalRequests";
  import PortalNewRequest from "./pages/emp/PortalNewRequest";
  import PortalNotifications from "./pages/emp/PortalNotifications";
  import ManagerPortal from "./pages/emp/ManagerPortal";
  import ChangePassword from "./pages/emp/ChangePassword";

  function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        </div>
      );
    }
    if (!isAuthenticated) return <LoginPage />;
    return (
      <ERPLayout>
        <Component />
      </ERPLayout>
    );
  }

  function EmpPortalRoute({ component: Component }: { component: React.ComponentType }) {
    const [, navigate] = useLocation();
    const { data: me, isLoading } = trpc.empPortal.me.useQuery(undefined, {
      retry: false,
      refetchOnWindowFocus: false,
    });

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!me) {
      navigate("/emp/login");
      return null;
    }

    return <Component />;
  }

  function Router() {
    return (
      <Switch>
        {/* ERP Routes */}
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/employees" component={() => <ProtectedRoute component={Employees} />} />
        <Route path="/contracts" component={() => <ProtectedRoute component={Contracts} />} />
        <Route path="/payroll" component={() => <ProtectedRoute component={Payroll} />} />
        <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} />} />
        <Route path="/revenue" component={() => <ProtectedRoute component={Revenue} />} />
        <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} />} />
        <Route path="/financial" component={() => <ProtectedRoute component={Financial} />} />
        <Route path="/branches" component={() => <ProtectedRoute component={Branches} />} />
        <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
        <Route path="/tasks" component={() => <ProtectedRoute component={Tasks} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
        <Route path="/ai-assistant" component={() => <ProtectedRoute component={AIAssistant} />} />
        <Route path="/import-data" component={() => <ProtectedRoute component={ImportData} />} />
        <Route path="/branches/:id" component={() => <ProtectedRoute component={BranchDetails} />} />
        <Route path="/employees/:id" component={() => <ProtectedRoute component={EmployeeProfile} />} />

        {/* Employee Self-Service Portal */}
        <Route path="/emp/login" component={PortalLogin} />
        <Route path="/emp/change-password" component={ChangePassword} />
        <Route path="/emp/requests/new" component={() => <EmpPortalRoute component={PortalNewRequest} />} />
        <Route path="/emp/requests" component={() => <EmpPortalRoute component={PortalRequests} />} />
        <Route path="/emp/notifications" component={() => <EmpPortalRoute component={PortalNotifications} />} />
        <Route path="/emp/manager" component={() => <EmpPortalRoute component={ManagerPortal} />} />
        <Route path="/emp" component={() => <EmpPortalRoute component={PortalDashboard} />} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  function App() {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  export default App;
  