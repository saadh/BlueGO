import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RoleBadge from "./RoleBadge";
import AddUserDialog from "./AddUserDialog";
import EditUserDialog from "./EditUserDialog";
import AddGateDialog from "./AddGateDialog";
import EditGateDialog from "./EditGateDialog";
import AddClassDialog from "./AddClassDialog";
import EditClassDialog from "./EditClassDialog";
import AssignTeacherClassesDialog from "./AssignTeacherClassesDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Class, Gate } from "@shared/schema";

export default function SchoolAdminDashboard() {
  const { toast } = useToast();

  // Dialog state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [addGateOpen, setAddGateOpen] = useState(false);
  const [editGateOpen, setEditGateOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  const [assignClassesOpen, setAssignClassesOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null);

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch classes
  interface ClassWithTeachers extends Class {
    teachers?: Array<{ id: string; firstName: string; lastName: string }>;
  }

  const { data: classes = [], isLoading: classesLoading } = useQuery<ClassWithTeachers[]>({
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

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      await apiRequest("POST", "/api/admin/users", {
        firstName,
        lastName,
        email: data.email,
        role: data.role,
        password: "changeme123", // Default password
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setAddUserOpen(false);
      toast({
        title: "Success",
        description: "User added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    },
  });

  // Add gate mutation
  const addGateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/gates", {
        name: data.name,
        location: data.location,
        status: data.status.toLowerCase(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gates"] });
      setAddGateOpen(false);
      toast({
        title: "Success",
        description: "Gate added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add gate",
        variant: "destructive",
      });
    },
  });

  // Add class mutation
  const addClassMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        // School name is auto-populated by server from organization
        grade: data.grade,
        section: data.class,
      };
      if (data.teacher) {
        payload.teacherId = data.teacher;
      }
      await apiRequest("POST", "/api/admin/classes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      setAddClassOpen(false);
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add class",
        variant: "destructive",
      });
    },
  });

  // Edit gate mutation
  const editGateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/admin/gates/${id}`, {
        name: data.name,
        location: data.location,
        status: data.status.toLowerCase(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gates"] });
      setEditGateOpen(false);
      toast({
        title: "Success",
        description: "Gate updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update gate",
        variant: "destructive",
      });
    },
  });

  // Edit class mutation
  const editClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload: any = {
        grade: data.grade,
        section: data.class,
      };
      if (data.teacher) {
        payload.teacherId = data.teacher;
      }
      await apiRequest("PATCH", `/api/admin/classes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/classes"] });
      setEditClassOpen(false);
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    },
  });

  const handleAddUser = (data: any) => {
    addUserMutation.mutate(data);
  };

  const handleEditUser = (data: any) => {
    // Edit user not implemented in API yet - placeholder
    console.log("Edit user (not yet implemented):", data);
    setEditUserOpen(false);
  };

  const handleAddGate = (data: any) => {
    addGateMutation.mutate(data);
  };

  const handleEditGate = (data: any) => {
    if (selectedGate) {
      editGateMutation.mutate({ id: selectedGate.id, data });
    }
  };

  const handleAddClass = (data: any) => {
    addClassMutation.mutate(data);
  };

  const handleEditClass = (data: any) => {
    if (selectedClass) {
      editClassMutation.mutate({ id: selectedClass.id, data });
    }
  };

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

  // Function to get teacher's assigned classes (to be fetched per teacher)
  const useTeacherClasses = (teacherId: string) => {
    return useQuery<Class[]>({
      queryKey: ["/api/admin/teacher-classes", teacherId],
      enabled: !!teacherId,
    });
  };

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
                <Button onClick={() => setAddUserOpen(true)} data-testid="button-add-user">
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
                      <TableHead>Assigned Classes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userArray.map((user) => {
                      const UserRow = () => {
                        const { data: teacherClasses = [] } = user.role === 'teacher' 
                          ? useTeacherClasses(user.id) 
                          : { data: [] };

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                            <TableCell>{user.email || user.phone}</TableCell>
                            <TableCell>
                              <RoleBadge role={user.role} />
                            </TableCell>
                            <TableCell>
                              {user.role === 'teacher' ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {teacherClasses.length > 0 ? (
                                    teacherClasses.map((cls) => (
                                      <Badge key={cls.id} variant="secondary" className="text-xs">
                                        Grade {cls.grade}-{cls.section}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">No classes</span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setSelectedTeacher({
                                        id: user.id,
                                        name: `${user.firstName} ${user.lastName}`,
                                      });
                                      setAssignClassesOpen(true);
                                    }}
                                    data-testid={`button-assign-${user.id}`}
                                  >
                                    <BookOpen className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser({
                                      id: user.id,
                                      name: `${user.firstName} ${user.lastName}`,
                                      email: user.email || '',
                                      role: user.role,
                                    });
                                    setEditUserOpen(true);
                                  }}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
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
                        );
                      };
                      
                      return <UserRow key={user.id} />;
                    })}
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
                <Button onClick={() => setAddGateOpen(true)} data-testid="button-add-gate">
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
                              onClick={() => {
                                setSelectedGate({
                                  id: gate.id,
                                  name: gate.name,
                                  location: gate.location,
                                  status: gate.status,
                                });
                                setEditGateOpen(true);
                              }}
                              data-testid={`button-edit-gate-${gate.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
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
                <Button onClick={() => setAddClassOpen(true)} data-testid="button-add-class">
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
                        <TableCell>
                          {cls.teachers && cls.teachers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {cls.teachers.map((teacher: any, index: number) => (
                                <span key={teacher.id} className="text-sm">
                                  {teacher.firstName} {teacher.lastName}
                                  {index < (cls.teachers?.length ?? 0) - 1 ? ',' : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{cls.roomNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedClass({
                                  id: cls.id,
                                  grade: cls.grade.toString(),
                                  class: cls.section,
                                  teacher: cls.teacherId || '',
                                });
                                setEditClassOpen(true);
                              }}
                              data-testid={`button-edit-class-${cls.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
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

      {/* Dialogs */}
      <AddUserDialog 
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSubmit={handleAddUser}
      />
      <EditUserDialog 
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        onSubmit={handleEditUser}
        user={selectedUser}
      />
      <AddGateDialog 
        open={addGateOpen}
        onOpenChange={setAddGateOpen}
        onSubmit={handleAddGate}
      />
      <EditGateDialog 
        open={editGateOpen}
        onOpenChange={setEditGateOpen}
        onSubmit={handleEditGate}
        gate={selectedGate}
      />
      <AddClassDialog 
        open={addClassOpen}
        onOpenChange={setAddClassOpen}
        onSubmit={handleAddClass}
        teachers={teachersList}
      />
      <EditClassDialog 
        open={editClassOpen}
        onOpenChange={setEditClassOpen}
        onSubmit={handleEditClass}
        classData={selectedClass}
        teachers={teachersList}
      />
      {selectedTeacher && (
        <AssignTeacherClassesDialog 
          open={assignClassesOpen}
          onOpenChange={setAssignClassesOpen}
          teacherId={selectedTeacher.id}
          teacherName={selectedTeacher.name}
        />
      )}
    </div>
  );
}
