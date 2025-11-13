import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ParentLandingPage from "@/pages/parent-landing";
import SchoolLandingPage from "@/pages/school-landing";
import ParentPage from "@/pages/parent";
import SecurityPage from "@/pages/security";
import ClassroomPage from "@/pages/classroom";
import AdminPage from "@/pages/admin";
import SuperAdminPage from "@/pages/superadmin";
import SuperAdminUsersPage from "@/pages/superadmin-users";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ParentLandingPage} />
      <Route path="/school" component={SchoolLandingPage} />
      <ProtectedRoute path="/parent" component={ParentPage} allowedRoles={["parent"]} />
      <ProtectedRoute path="/security" component={SecurityPage} allowedRoles={["security"]} />
      <ProtectedRoute path="/classroom" component={ClassroomPage} allowedRoles={["teacher"]} />
      <ProtectedRoute path="/admin" component={AdminPage} allowedRoles={["admin"]} />
      <ProtectedRoute path="/superadmin/users" component={SuperAdminUsersPage} allowedRoles={["superadmin"]} />
      <ProtectedRoute path="/superadmin" component={SuperAdminPage} allowedRoles={["superadmin"]} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
