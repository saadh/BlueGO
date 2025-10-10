import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Shield, Monitor, Settings } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">B</span>
            </div>
            <h1 className="text-2xl font-bold">BlueGO</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">School Dismissal Management System</h2>
          <p className="text-xl text-muted-foreground">
            Streamline student pickup with NFC technology and real-time tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <User className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Parent Portal</CardTitle>
              <CardDescription>
                Manage your children's profiles and link NFC cards for quick pickup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/parent">
                <Button className="w-full" data-testid="link-parent">
                  Access Parent Portal
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[#FF3547]/10 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-[#FF3547]" />
              </div>
              <CardTitle>Security Gate</CardTitle>
              <CardDescription>
                Scan NFC cards and manage student dismissals at the security gate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/security">
                <Button variant="destructive" className="w-full" data-testid="link-security">
                  Access Security Gate
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[#00C851]/10 flex items-center justify-center mb-2">
                <Monitor className="h-6 w-6 text-[#00C851]" />
              </div>
              <CardTitle>Classroom Display</CardTitle>
              <CardDescription>
                Real-time dismissal queue for classroom screens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/classroom">
                <Button variant="secondary" className="w-full" data-testid="link-classroom">
                  View Classroom Display
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle>School Administration</CardTitle>
              <CardDescription>
                Manage users, gates, classes, and all system settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full" data-testid="link-admin">
                  Access Admin Panel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
