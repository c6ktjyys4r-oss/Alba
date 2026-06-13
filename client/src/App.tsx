import { Toaster } from "@/components/ui/sonner";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/NotFound";
  import LoginPage from "@/pages/Login";
  import { Route, Switch, Redirect } from "wouter";
  import ErrorBoundary from "./components/ErrorBoundary";
  import { ThemeProvider } from "./contexts/ThemeContext";
  import { LanguageProvider } from "./contexts/LanguageContext";
  import ERPLayout from "./components/ERPLayout";
  import { useAuth } from "./_core/hooks/useAuth";

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

  // Employee Self-Service pages (rendered inside the unified shell)
  import PortalDashboard from "./pages/emp/PortalDashboard";
  import PortalRequests from "./pages/emp/PortalRequests";
  import PortalNewRequest from "./pages/emp/PortalNewRequest";
  import PortalNotifications from "./pages/emp/PortalNotifications";
  import PortalAttendance from "./pages/emp/PortalAttendance";
  import ManagerPortal from "./pages/emp/ManagerPortal";
  import ChangePassword from "./pages/emp/ChangePassword";

  function AuthLoading() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#6D7B74] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Admin (super-admin-only) area of the unified app.
  function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
    const { user, loading } = useAuth();
    if (loading) return <AuthLoading />;
    if (!user) return <LoginPage />;
    if (user.role !== "super_admin") return <Redirect to="/emp" />;
    return (
      <ERPLayout>
        <Component />
      </ERPLayout>
    );
  }

  // Personal pages — available to any authenticated employee (the pages render
  // inside the unified shell via PortalLayout). Break-glass admin sessions have
  // no employee record, so they are sent to the admin home instead.
  function PortalRoute({ component: Component }: { component: React.ComponentType }) {
    const { user, loading } = useAuth();
    if (loading) return <AuthLoading />;
    if (!user) return <LoginPage />;
    if (!user.employeeId) return <Redirect to="/" />;
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

        {/* Unified login */}
        <Route path="/login" component={LoginPage} />
        <Route path="/emp/login">{() => <Redirect to="/login" />}</Route>

        {/* Personal pages (rendered inside the unified shell) */}
        <Route path="/emp/change-password" component={() => <PortalRoute component={ChangePassword} />} />
        <Route path="/emp/requests/new" component={() => <PortalRoute component={PortalNewRequest} />} />
        <Route path="/emp/requests" component={() => <PortalRoute component={PortalRequests} />} />
        <Route path="/emp/notifications" component={() => <PortalRoute component={PortalNotifications} />} />
        <Route path="/emp/attendance" component={() => <PortalRoute component={PortalAttendance} />} />
        <Route path="/emp/manager" component={() => <PortalRoute component={ManagerPortal} />} />
        <Route path="/emp" component={() => <PortalRoute component={PortalDashboard} />} />

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
  