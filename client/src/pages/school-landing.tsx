import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, Monitor, Settings } from "lucide-react";

export default function SchoolLandingPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Login form state
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case "parent":
          setLocation("/");
          break;
        case "teacher":
          setLocation("/classroom");
          break;
        case "security":
          setLocation("/security");
          break;
        case "admin":
          setLocation("/admin");
          break;
        default:
          setLocation("/");
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
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B</span>
              </div>
              <h1 className="text-2xl font-bold">BlueGO School Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Access the school staff portal for teachers, security, and administrators
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>School Staff Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your assigned portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email-phone">Email or Phone Number</Label>
                  <Input
                    id="login-email-phone"
                    type="text"
                    placeholder="user@school.com or +1234567890"
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    required
                    data-testid="input-login-email-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login to School Portal
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> School staff accounts are created by administrators. 
                  Contact your school admin if you need access.
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
      <div className="flex-1 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-12 order-1 lg:order-2">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">School Staff Portal</h1>
          <p className="text-lg mb-8">
            Secure access to dismissal management tools for teachers, security personnel, and administrators.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Teachers</h3>
                <p className="text-white/90">Monitor real-time dismissal queues for your classroom</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Security Staff</h3>
                <p className="text-white/90">Scan NFC cards and manage dismissals at gates</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Administrators</h3>
                <p className="text-white/90">Manage users, classes, gates, and system settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
