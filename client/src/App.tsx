import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ERPLayout from "./components/ERPLayout";
import { useAuth } from "./_core/hooks/useAuth";

// Pages
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ERPLayout>
      <Component />
    </ERPLayout>
  );
}

function Router() {
  return (
    <Switch>
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
