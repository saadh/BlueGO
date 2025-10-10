import AppHeader from "@/components/AppHeader";
import ParentDashboard from "@/components/ParentDashboard";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function ParentPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={fullName} userRole="parent" />
      <main className="container mx-auto px-6 py-8">
        <ParentDashboard user={user} />
      </main>
    </div>
  );
}
