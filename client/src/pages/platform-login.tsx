import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, BarChart3, Users, Shield } from "lucide-react";

export default function PlatformLoginPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Login form state
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Only superadmins should use this login
      if (user.role === "superadmin") {
        setLocation("/superadmin");
      } else {
        // Redirect other roles to school portal
        setLocation("/school");
      }
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      emailOrPhone: loginEmailOrPhone,
      password: loginPassword,
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <h1 className="text-2xl font-bold">BlueGO Platform</h1>
            </div>
            <p className="text-muted-foreground">
              Platform administrator access for managing organizations and system-wide settings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Administrator Login</CardTitle>
              <CardDescription>
                Enter your superadmin credentials to access the platform dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-email-phone">Email or Phone Number</Label>
                  <Input
                    id="platform-email-phone"
                    type="text"
                    placeholder="admin@bluego.com or +1234567890"
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    required
                    data-testid="input-platform-email-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-password">Password</Label>
                  <Input
                    id="platform-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="input-platform-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={loginMutation.isPending}
                  data-testid="button-platform-login"
                >
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login to Platform
                </Button>
              </form>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-900 dark:text-purple-100">
                  <strong>Superadmin Access Only:</strong> This portal is for platform administrators.
                  School staff should use the{" "}
                  <a href="/school" className="underline hover:text-purple-700">
                    School Portal
                  </a>.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Are you a parent?{" "}
              <a href="/" className="text-primary hover:underline" data-testid="link-parent">
                Access Parent Portal
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-12 order-1 lg:order-2">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Platform Dashboard</h1>
          <p className="text-lg mb-8">
            Comprehensive platform management for the BlueGO multi-tenant SaaS system.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Organization Management</h3>
                <p className="text-white/90">Create, suspend, and manage school organizations</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">User Administration</h3>
                <p className="text-white/90">Cross-organization user management and access control</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Analytics & Reporting</h3>
                <p className="text-white/90">Platform metrics, revenue tracking, and growth analytics</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Subscription Management</h3>
                <p className="text-white/90">Manage plans, trials, billing cycles, and usage limits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
