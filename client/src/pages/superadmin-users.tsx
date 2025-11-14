import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Ban, CheckCircle, Building2, Mail, Phone, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/use-auth";

type UserRole = "admin" | "teacher" | "security" | "parent";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string | null;
  organizationName: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-500",
  teacher: "bg-blue-500",
  security: "bg-red-500",
  parent: "bg-green-500",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  security: "Security",
  parent: "Parent",
};

export default function SuperAdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [suspendedFilter, setSuspendedFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  if (!user) return null;

  // Fetch users
  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["/api/superadmin/users", page, search, roleFilter, suspendedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);
      if (suspendedFilter) params.append("suspended", suspendedFilter);

      const response = await fetch(`/api/superadmin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // Suspend user
  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/superadmin/users/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to suspend user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({
        title: "User Suspended",
        description: "The user has been suspended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    },
  });

  // Unsuspend user
  const unsuspendMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/superadmin/users/${id}/unsuspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to unsuspend user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      toast({
        title: "User Unsuspended",
        description: "The user has been unsuspended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unsuspend user",
        variant: "destructive",
      });
    },
  });

  const handleSuspend = (user: User) => {
    const reason = prompt("Enter reason for suspension:");
    if (reason) {
      suspendMutation.mutate({ id: user.id, reason });
    }
  };

  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={fullName} userRole="superadmin" />
      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users across all organizations</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/superadmin">
              <Building2 className="h-4 w-4 mr-2" />
              Back to Organizations
            </Link>
          </Button>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={suspendedFilter || "all"} onValueChange={(value) => setSuspendedFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      ) : data?.users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {user.firstName} {user.lastName}
                          {user.isSuspended && (
                            <Badge variant="destructive" className="ml-2">
                              Suspended
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      <CardDescription className="space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.organizationName && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            <span>{user.organizationName}</span>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.isSuspended && user.suspendedReason && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          Suspended
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {user.suspendedReason}
                        </p>
                        {user.suspendedAt && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Suspended on {new Date(user.suspendedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {user.isSuspended ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => unsuspendMutation.mutate(user.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Unsuspend
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSuspend(user)}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center ml-auto">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
}
