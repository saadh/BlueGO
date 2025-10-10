import AppHeader from "@/components/AppHeader";
import SecurityDashboard from "@/components/SecurityDashboard";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName="Officer Martinez" userRole="security" />
      <main className="container mx-auto px-6 py-8">
        <SecurityDashboard />
      </main>
    </div>
  );
}
