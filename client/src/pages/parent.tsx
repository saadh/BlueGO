import AppHeader from "@/components/AppHeader";
import ParentDashboard from "@/components/ParentDashboard";

export default function ParentPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName="Sarah Johnson" userRole="parent" />
      <main className="container mx-auto px-6 py-8">
        <ParentDashboard />
      </main>
    </div>
  );
}
