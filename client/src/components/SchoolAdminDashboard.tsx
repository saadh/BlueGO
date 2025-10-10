import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RoleBadge, { type UserRole } from "./RoleBadge";

// todo: remove mock functionality
const mockUsers = [
  { id: "1", name: "Sarah Johnson", email: "sarah@email.com", role: "parent" as UserRole },
  { id: "2", name: "Officer Martinez", email: "martinez@school.edu", role: "security" as UserRole },
  { id: "3", name: "Ms. Anderson", email: "anderson@school.edu", role: "teacher" as UserRole },
];

const mockGates = [
  { id: "1", name: "Gate A", location: "Main Entrance", status: "Active" },
  { id: "2", name: "Gate B", location: "East Side", status: "Active" },
  { id: "3", name: "Gate C", location: "West Side", status: "Inactive" },
];

const mockClasses = [
  { id: "1", grade: "5", class: "A", teacher: "Ms. Anderson", students: 28 },
  { id: "2", grade: "5", class: "B", teacher: "Mr. Thompson", students: 25 },
  { id: "3", grade: "4", class: "A", teacher: "Mrs. Wilson", students: 30 },
];

export default function SchoolAdminDashboard() {
  const [users, setUsers] = useState(mockUsers);
  const [gates, setGates] = useState(mockGates);
  const [classes, setClasses] = useState(mockClasses);

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    console.log('User deleted:', id);
  };

  const handleDeleteGate = (id: string) => {
    setGates(gates.filter(g => g.id !== id));
    console.log('Gate deleted:', id);
  };

  const handleDeleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    console.log('Class deleted:', id);
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
          <TabsTrigger value="students" data-testid="tab-students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" data-testid={`button-edit-${user.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteUser(user.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
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
                  {gates.map((gate) => (
                    <TableRow key={gate.id}>
                      <TableCell className="font-medium">{gate.name}</TableCell>
                      <TableCell>{gate.location}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${gate.status === 'Active' ? 'text-[#00C851]' : 'text-muted-foreground'}`}>
                          {gate.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" data-testid={`button-edit-gate-${gate.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteGate(gate.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">Grade {cls.grade}</TableCell>
                      <TableCell>Class {cls.class}</TableCell>
                      <TableCell>{cls.teacher}</TableCell>
                      <TableCell>{cls.students}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" data-testid={`button-edit-class-${cls.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClass(cls.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>View and manage all student records</CardDescription>
                </div>
                <Button data-testid="button-add-student-admin">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Student records will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
