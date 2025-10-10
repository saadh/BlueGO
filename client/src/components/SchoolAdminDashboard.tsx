import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RoleBadge from "./RoleBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Class, Gate } from "@shared/schema";

export default function SchoolAdminDashboard() {
  const { toast } = useToast();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch classes
  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ["/api/admin/classes"],
  });

  // Fetch gates
  const { data: gates = [], isLoading: gatesLoading } = useQuery<Gate[]>({
    queryKey: ["/api/admin/gates"],
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    },
  });

  // Delete gate mutation
  const deleteGateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/gates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gates"] });
      toast({
        title: "Success",
        description: "Gate deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete gate",
        variant: "destructive",
      });
    },
  });

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "Unassigned";
    const userArray = Array.isArray(users) ? users : [];
    const teacher = userArray.find(u => u.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown";
  };

  const userArray = Array.isArray(users) ? users : [];
  const gatesArray = Array.isArray(gates) ? gates : [];
  const classesArray = Array.isArray(classes) ? classes : [];
  
  const teachersList = userArray
    .filter(user => user.role === 'teacher')
    .map(teacher => ({
      id: teacher.id,
      name: `${teacher.firstName} ${teacher.lastName}`,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Administration</h1>
        <p className="text-muted-foreground mt-1">Manage all aspects of your school's dismissal system</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="gates" data-testid="tab-gates">Gates</TabsTrigger>
          <TabsTrigger value="classes" data-testid="tab-classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Add, edit, and manage all system users</CardDescription>
                </div>
                <Button data-testid="button-add-user">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading users...</div>
              ) : userArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email/Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userArray.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email || user.phone}</TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              data-testid={`button-delete-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Security Gates</CardTitle>
                  <CardDescription>Manage security gate locations and status</CardDescription>
                </div>
                <Button data-testid="button-add-gate">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gatesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading gates...</div>
              ) : gatesArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No gates found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gate Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gatesArray.map((gate) => (
                      <TableRow key={gate.id}>
                        <TableCell className="font-medium">{gate.name}</TableCell>
                        <TableCell>{gate.location}</TableCell>
                        <TableCell>
                          <span className={`text-sm ${gate.status === 'active' ? 'text-[#00C851]' : 'text-muted-foreground'}`}>
                            {gate.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteGateMutation.mutate(gate.id)}
                              data-testid={`button-delete-gate-${gate.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Class Management</CardTitle>
                  <CardDescription>View and manage grades and classes</CardDescription>
                </div>
                <Button data-testid="button-add-class">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading classes...</div>
              ) : classesArray.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No classes found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classesArray.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.school}</TableCell>
                        <TableCell>Grade {cls.grade}</TableCell>
                        <TableCell>Section {cls.section}</TableCell>
                        <TableCell>{getTeacherName(cls.teacherId)}</TableCell>
                        <TableCell>{cls.roomNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteClassMutation.mutate(cls.id)}
                              data-testid={`button-delete-class-${cls.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
