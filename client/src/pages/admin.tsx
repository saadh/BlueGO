import AppHeader from "@/components/AppHeader";
import SchoolAdminDashboard from "@/components/SchoolAdminDashboard";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName="Dr. Robert Williams" userRole="section_manager" />
      <main className="container mx-auto px-6 py-8">
        <SchoolAdminDashboard />
      </main>
    </div>
  );
}
