import AppHeader from "@/components/AppHeader";
import SchoolAdminDashboard from "@/components/SchoolAdminDashboard";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user.role !== 'admin') {
    return <Redirect to="/school" />;
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={fullName} userRole="admin" />
      <main className="container mx-auto px-6 py-8">
        <SchoolAdminDashboard />
      </main>
    </div>
  );
}
