import { useState } from "react";
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
import RoleBadge, { type UserRole } from "./RoleBadge";
import AddUserDialog from "./AddUserDialog";
import AddGateDialog from "./AddGateDialog";
import AddClassDialog from "./AddClassDialog";
import AssignTeacherDialog from "./AssignTeacherDialog";
import EditUserDialog from "./EditUserDialog";
import EditGateDialog from "./EditGateDialog";
import EditClassDialog from "./EditClassDialog";
import AddStudentDialog from "./AddStudentDialog";

// todo: remove mock functionality
const mockUsers = [
  { id: "1", name: "Sarah Johnson", email: "sarah@email.com", role: "parent" as UserRole, assignedClasses: [] as string[] },
  { id: "2", name: "Officer Martinez", email: "martinez@school.edu", role: "security" as UserRole, assignedClasses: [] as string[] },
  { id: "3", name: "Ms. Anderson", email: "anderson@school.edu", role: "teacher" as UserRole, assignedClasses: ["1", "2"] as string[] },
];

const mockGates = [
  { id: "1", name: "Gate A", location: "Main Entrance", status: "Active" },
  { id: "2", name: "Gate B", location: "East Side", status: "Active" },
  { id: "3", name: "Gate C", location: "West Side", status: "Inactive" },
];

const mockClasses = [
  { id: "1", grade: "5", class: "A", teacher: "Ms. Anderson", students: 28 },
  { id: "2", grade: "5", class: "B", teacher: "Ms. Anderson", students: 25 },
  { id: "3", grade: "4", class: "A", teacher: "Mrs. Wilson", students: 30 },
];

// todo: remove mock functionality - student records
const mockStudents = [
  { id: "1", name: "Emma Johnson", studentId: "ID-12345", parentName: "Sarah Johnson", parentEmail: "sarah@email.com", parentPhone: "+1 (555) 123-4567", grade: "5", class: "A", nfcCardId: "NFC-001" },
  { id: "2", name: "Liam Smith", studentId: "ID-12346", parentName: "Michael Smith", parentEmail: "michael@email.com", parentPhone: "+1 (555) 123-4568", grade: "5", class: "A", nfcCardId: "NFC-002" },
  { id: "3", name: "Olivia Brown", studentId: "ID-12347", parentName: "Jennifer Brown", parentEmail: "jennifer@email.com", parentPhone: "+1 (555) 123-4569", grade: "4", class: "A", nfcCardId: "" },
];

export default function SchoolAdminDashboard() {
  const [users, setUsers] = useState(mockUsers);
  const [gates, setGates] = useState(mockGates);
  const [classes, setClasses] = useState(mockClasses);
  const [students, setStudents] = useState(mockStudents);
  
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddGateOpen, setIsAddGateOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
  
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditGateOpen, setIsEditGateOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  
  const [selectedTeacher, setSelectedTeacher] = useState<{ id: string; name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const handleAddUser = (userData: any) => {
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      assignedClasses: [],
    };
    setUsers([...users, newUser]);
    setIsAddUserOpen(false);
    console.log('User added:', newUser);
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    console.log('User deleted:', id);
  };

  const handleAddGate = (gateData: any) => {
    const newGate = {
      ...gateData,
      id: Date.now().toString(),
    };
    setGates([...gates, newGate]);
    setIsAddGateOpen(false);
    console.log('Gate added:', newGate);
  };

  const handleDeleteGate = (id: string) => {
    setGates(gates.filter(g => g.id !== id));
    console.log('Gate deleted:', id);
  };

  const handleAddClass = (classData: any) => {
    const newClass = {
      ...classData,
      id: Date.now().toString(),
      students: 0,
    };
    setClasses([...classes, newClass]);
    setIsAddClassOpen(false);
    console.log('Class added:', newClass);
  };

  const handleDeleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    console.log('Class deleted:', id);
  };

  const handleOpenAssignTeacher = (teacher: { id: string; name: string }) => {
    setSelectedTeacher(teacher);
    setIsAssignTeacherOpen(true);
  };

  const handleAssignClasses = (teacherId: string, assignedClassIds: string[]) => {
    setUsers(users.map(user => 
      user.id === teacherId 
        ? { ...user, assignedClasses: assignedClassIds }
        : user
    ));
    console.log('Classes assigned to teacher:', teacherId, assignedClassIds);
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleEditUser = (userData: any) => {
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...userData }
        : u
    ));
    setIsEditUserOpen(false);
    console.log('User updated:', selectedUser.id, userData);
  };

  const handleOpenEditGate = (gate: any) => {
    setSelectedGate(gate);
    setIsEditGateOpen(true);
  };

  const handleEditGate = (gateData: any) => {
    setGates(gates.map(g => 
      g.id === selectedGate.id 
        ? { ...g, ...gateData }
        : g
    ));
    setIsEditGateOpen(false);
    console.log('Gate updated:', selectedGate.id, gateData);
  };

  const handleOpenEditClass = (classData: any) => {
    setSelectedClass(classData);
    setIsEditClassOpen(true);
  };

  const handleEditClass = (classData: any) => {
    setClasses(classes.map(c => 
      c.id === selectedClass.id 
        ? { ...c, ...classData }
        : c
    ));
    setIsEditClassOpen(false);
    console.log('Class updated:', selectedClass.id, classData);
  };

  const handleAddStudent = (studentData: any) => {
    const newStudent = {
      ...studentData,
      id: Date.now().toString(),
    };
    setStudents([...students, newStudent]);
    setIsAddStudentOpen(false);
    console.log('Student added:', newStudent);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
    console.log('Student deleted:', id);
  };

  const availableClassOptions = classes.map(cls => ({
    id: cls.id,
    grade: cls.grade,
    class: cls.class,
    label: `Grade ${cls.grade} - Class ${cls.class}`,
  }));

  const teachersList = users
    .filter(user => user.role === 'teacher')
    .map(teacher => ({
      id: teacher.id,
      name: teacher.name,
    }));

  const getTeacherAssignments = (teacherId: string) => {
    const user = users.find(u => u.id === teacherId);
    if (!user || !user.assignedClasses.length) return "No assignments";
    
    const assignedClassLabels = user.assignedClasses
      .map(classId => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `G${cls.grade}${cls.class}` : null;
      })
      .filter(Boolean)
      .join(", ");
    
    return assignedClassLabels || "No assignments";
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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Add, edit, and manage all system users</CardDescription>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)} data-testid="button-add-user">
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
                    <TableHead>Assignments</TableHead>
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
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.role === 'teacher' ? getTeacherAssignments(user.id) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {user.role === 'teacher' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenAssignTeacher({ id: user.id, name: user.name })}
                              data-testid={`button-assign-${user.id}`}
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditUser(user)}
                            data-testid={`button-edit-${user.id}`}
                          >
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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Security Gates</CardTitle>
                  <CardDescription>Manage security gate locations and status</CardDescription>
                </div>
                <Button onClick={() => setIsAddGateOpen(true)} data-testid="button-add-gate">
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditGate(gate)}
                            data-testid={`button-edit-gate-${gate.id}`}
                          >
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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Class Management</CardTitle>
                  <CardDescription>View and manage grades and classes</CardDescription>
                </div>
                <Button onClick={() => setIsAddClassOpen(true)} data-testid="button-add-class">
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenEditClass(cls)}
                            data-testid={`button-edit-class-${cls.id}`}
                          >
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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>View and manage all student records</CardDescription>
                </div>
                <Button onClick={() => setIsAddStudentOpen(true)} data-testid="button-add-student-admin">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>NFC Card</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>Grade {student.grade}</TableCell>
                      <TableCell>Class {student.class}</TableCell>
                      <TableCell>{student.parentName}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${student.nfcCardId ? 'text-[#00C851]' : 'text-muted-foreground'}`}>
                          {student.nfcCardId || 'Not assigned'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteStudent(student.id)}
                            data-testid={`button-delete-student-${student.id}`}
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
      </Tabs>

      <AddUserDialog 
        open={isAddUserOpen} 
        onOpenChange={setIsAddUserOpen}
        onSubmit={handleAddUser}
      />
      <AddGateDialog 
        open={isAddGateOpen} 
        onOpenChange={setIsAddGateOpen}
        onSubmit={handleAddGate}
      />
      <AddClassDialog 
        open={isAddClassOpen} 
        onOpenChange={setIsAddClassOpen}
        onSubmit={handleAddClass}
        teachers={teachersList}
      />
      <AddStudentDialog 
        open={isAddStudentOpen} 
        onOpenChange={setIsAddStudentOpen}
        onSubmit={handleAddStudent}
      />
      <AssignTeacherDialog 
        open={isAssignTeacherOpen} 
        onOpenChange={setIsAssignTeacherOpen}
        teacher={selectedTeacher}
        availableClasses={availableClassOptions}
        currentAssignments={selectedTeacher ? users.find(u => u.id === selectedTeacher.id)?.assignedClasses || [] : []}
        onSubmit={handleAssignClasses}
      />
      <EditUserDialog 
        open={isEditUserOpen} 
        onOpenChange={setIsEditUserOpen}
        onSubmit={handleEditUser}
        user={selectedUser}
      />
      <EditGateDialog 
        open={isEditGateOpen} 
        onOpenChange={setIsEditGateOpen}
        onSubmit={handleEditGate}
        gate={selectedGate}
      />
      <EditClassDialog 
        open={isEditClassOpen} 
        onOpenChange={setIsEditClassOpen}
        onSubmit={handleEditClass}
        classData={selectedClass}
        teachers={teachersList}
      />
    </div>
  );
}
