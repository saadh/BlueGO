import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, AlertCircle, CheckCircle, XCircle, Plus, Search } from "lucide-react";

type SubscriptionStatus = "active" | "suspended" | "cancelled" | "trial" | "expired";

interface Organization {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  contactName: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: string;
  isActive: boolean;
  maxStudents: string;
  maxStaff: string;
  createdAt: string;
  suspendedReason?: string;
  stats?: {
    admins: number;
    staff: number;
    parents: number;
  };
}

interface OrganizationsResponse {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusColors: Record<SubscriptionStatus, string> = {
  active: "bg-green-500",
  trial: "bg-blue-500",
  suspended: "bg-red-500",
  cancelled: "bg-gray-500",
  expired: "bg-orange-500",
};

export default function SuperAdminDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data, isLoading } = useQuery<OrganizationsResponse>({
    queryKey: ["/api/superadmin/organizations", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/superadmin/organizations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch organizations");
      return response.json();
    },
  });

  // Suspend organization
  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/superadmin/organizations/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error("Failed to suspend organization");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      toast({
        title: "Organization Suspended",
        description: "The organization has been suspended successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to suspend organization",
        variant: "destructive",
      });
    },
  });

  // Activate organization
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/superadmin/organizations/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to activate organization");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      toast({
        title: "Organization Activated",
        description: "The organization has been activated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to activate organization",
        variant: "destructive",
      });
    },
  });

  const handleSuspend = (org: Organization) => {
    const reason = prompt("Enter reason for suspension:");
    if (reason) {
      suspendMutation.mutate({ id: org.id, reason });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage organizations and subscriptions</p>
        </div>
        <CreateOrganizationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading organizations...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.organizations.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {org.name}
                        {!org.isActive && (
                          <Badge variant="destructive" className="ml-2">
                            Suspended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        <span className="font-mono text-xs">{org.slug}</span> • {org.contactEmail}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[org.subscriptionStatus]}>
                      {org.subscriptionStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-medium">{org.subscriptionPlan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Students</p>
                      <p className="font-medium">{org.maxStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Staff</p>
                      <p className="font-medium">{org.maxStaff}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {org.suspendedReason && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          Suspended
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {org.suspendedReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {org.isActive ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleSuspend(org)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => activateMutation.mutate(org.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/superadmin/organizations/${org.id}`}>View Details</a>
                    </Button>
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
    </div>
  );
}

function CreateOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    maxStudents: "100",
    maxStaff: "10",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/superadmin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create organization");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/organizations"] });
      toast({
        title: "Organization Created",
        description: "The organization has been created successfully.",
      });
      onOpenChange(false);
      setFormData({
        name: "",
        slug: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        maxStudents: "100",
        maxStaff: "10",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Add a new school or organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max Students</Label>
                <Input
                  id="maxStudents"
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStudents: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStaff">Max Staff</Label>
                <Input
                  id="maxStaff"
                  value={formData.maxStaff}
                  onChange={(e) =>
                    setFormData({ ...formData, maxStaff: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
