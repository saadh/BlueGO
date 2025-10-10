import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Shield, Clock } from "lucide-react";

export default function ParentLandingPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Login form state
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [useEmail, setUseEmail] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "parent") {
        setLocation("/parent");
      } else {
        // Non-parents should go to school portal
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      email: useEmail ? registerEmail : undefined,
      phone: !useEmail ? registerPhone : undefined,
      password: registerPassword,
      firstName: registerFirstName,
      lastName: registerLastName,
      role: "parent",
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">B</span>
              </div>
              <h1 className="text-2xl font-bold">BlueGO Parent Portal</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your children's profiles and track their safe dismissal
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Parent Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your parent portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email-phone">Email or Phone Number</Label>
                      <Input
                        id="login-email-phone"
                        type="text"
                        placeholder="user@example.com or +1234567890"
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
                      Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Parent Account</CardTitle>
                  <CardDescription>
                    Register to start managing your children's pickup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          required
                          data-testid="input-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          required
                          data-testid="input-last-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Method</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={useEmail ? "default" : "outline"}
                          onClick={() => setUseEmail(true)}
                          className="flex-1"
                          data-testid="button-use-email"
                        >
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={!useEmail ? "default" : "outline"}
                          onClick={() => setUseEmail(false)}
                          className="flex-1"
                          data-testid="button-use-phone"
                        >
                          Phone
                        </Button>
                      </div>
                    </div>

                    {useEmail ? (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          data-testid="input-email"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          required
                          data-testid="input-phone"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={8}
                        data-testid="input-password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Parent Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              School staff?{" "}
              <a href="/school" className="text-primary hover:underline" data-testid="link-school">
                Access School Portal
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-12 order-1 lg:order-2">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome Parents</h1>
          <p className="text-lg mb-8">
            BlueGO makes student pickup safe, fast, and stress-free with NFC technology and real-time tracking.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manage Children</h3>
                <p className="text-white/90">Add and manage all your children's profiles in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">NFC Card Linking</h3>
                <p className="text-white/90">Link your NFC card once for quick and secure pickup</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-Time Updates</h3>
                <p className="text-white/90">Track dismissal status and know when to arrive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
