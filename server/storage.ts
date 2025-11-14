import {
  type User, type InsertUser, type UserRole,
  type Student, type InsertStudent,
  type Class, type InsertClass,
  type Gate, type InsertGate, type GateStatus,
  type Dismissal, type InsertDismissal, type DismissalStatus,
  type TeacherClass, type InsertTeacherClass,
  type Organization,
  users, students, classes, gates, dismissals, teacherClasses, organizations
} from "@shared/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  getUserByNFCCard(nfcCardId: string): Promise<User | undefined>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserNFCCard(userId: string, nfcCardId: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Student operations
  getStudentsByParentId(parentId: string): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | undefined>;
  getStudentsByClass(school: string, grade: string, section: string): Promise<Student[]>;
  getStudentsByClassId(classId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  
  // Class operations
  getAllClasses(): Promise<Class[]>;
  getClassById(id: string): Promise<Class | undefined>;
  getClassesByTeacher(teacherId: string): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  
  // Gate operations
  getAllGates(): Promise<Gate[]>;
  getGateById(id: string): Promise<Gate | undefined>;
  getActiveGates(): Promise<Gate[]>;
  createGate(gate: InsertGate): Promise<Gate>;
  updateGate(id: string, gate: Partial<InsertGate>): Promise<Gate | undefined>;
  deleteGate(id: string): Promise<boolean>;
  
  // Dismissal operations
  getAllDismissals(): Promise<Dismissal[]>;
  getDismissalById(id: string): Promise<Dismissal | undefined>;
  getDismissalsByStudent(studentId: string): Promise<Dismissal[]>;
  getDismissalsByStatus(status: DismissalStatus): Promise<Dismissal[]>;
  getDismissalsForTeacherClasses(teacherId: string): Promise<any[]>;
  createDismissal(dismissal: InsertDismissal): Promise<Dismissal>;
  updateDismissal(id: string, dismissal: Partial<InsertDismissal>): Promise<Dismissal | undefined>;
  deleteDismissal(id: string): Promise<boolean>;
  
  // Teacher-Class assignment operations
  getTeacherClassAssignments(teacherId: string): Promise<Class[]>;
  getClassTeacherAssignments(classId: string): Promise<User[]>;
  createTeacherClassAssignment(assignment: InsertTeacherClass): Promise<TeacherClass>;
  deleteTeacherClassAssignment(teacherId: string, classId: string): Promise<boolean>;
  deleteAllTeacherClassAssignments(teacherId: string): Promise<boolean>;

  // Statistics operations
  getDismissalStatistics(startDate?: Date, endDate?: Date): Promise<any>;
  getGateStatistics(startDate?: Date, endDate?: Date): Promise<any>;
  getDismissalsByHour(date?: Date): Promise<any>;

  sessionStore: session.Store;
}

export class DbStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        emailOrPhone.includes('@') 
          ? eq(users.email, emailOrPhone) 
          : eq(users.phone, emailOrPhone)
      );
    return user;
  }

  async getUserByNFCCard(nfcCardId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nfcCardId, nfcCardId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserNFCCard(userId: string, nfcCardId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ nfcCardId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Student operations
  async getStudentsByParentId(parentId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.parentId, parentId));
  }

  async getStudentById(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    // Auto-assign classId by finding matching class based on school, grade, and section
    const matchingClass = await db
      .select()
      .from(classes)
      .where(
        and(
          eq(classes.school, insertStudent.school),
          eq(classes.grade, insertStudent.grade),
          eq(classes.section, insertStudent.class)
        )
      )
      .limit(1);
    
    const studentData = {
      ...insertStudent,
      classId: matchingClass.length > 0 ? matchingClass[0].id : null,
    };
    
    const [student] = await db.insert(students).values(studentData).returning();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    // If grade or class is being updated, also update classId
    let dataToUpdate = { ...updateData, updatedAt: new Date() };
    
    if (updateData.grade !== undefined || updateData.class !== undefined || updateData.school !== undefined) {
      const student = await this.getStudentById(id);
      if (student) {
        const matchingClass = await db
          .select()
          .from(classes)
          .where(
            and(
              eq(classes.school, updateData.school ?? student.school),
              eq(classes.grade, updateData.grade ?? student.grade),
              eq(classes.section, updateData.class ?? student.class)
            )
          )
          .limit(1);
        
        dataToUpdate.classId = matchingClass.length > 0 ? matchingClass[0].id : null;
      }
    }
    
    const [updatedStudent] = await db
      .update(students)
      .set(dataToUpdate)
      .where(eq(students.id, id))
      .returning();
    return updatedStudent;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getStudentsByClass(school: string, grade: string, section: string): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.school, school),
          eq(students.grade, grade),
          eq(students.class, section)
        )
      );
  }

  async getStudentsByClassId(classId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.classId, classId));
  }

  // Class operations
  async getAllClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  // Get all classes with their assigned teachers from junction table
  async getAllClassesWithTeachers(): Promise<Array<Class & { teachers: User[] }>> {
    const allClasses = await db.select().from(classes);
    
    const classesWithTeachers = await Promise.all(
      allClasses.map(async (cls) => {
        // Get all teachers assigned to this class via junction table
        const teacherAssignments = await db
          .select({ user: users })
          .from(teacherClasses)
          .innerJoin(users, eq(teacherClasses.teacherId, users.id))
          .where(eq(teacherClasses.classId, cls.id));
        
        return {
          ...cls,
          teachers: teacherAssignments.map(t => t.user),
        };
      })
    );
    
    return classesWithTeachers;
  }

  async getClassById(id: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    return await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const [classData] = await db.insert(classes).values(insertClass).returning();
    return classData;
  }

  async updateClass(id: string, updateData: Partial<InsertClass>): Promise<Class | undefined> {
    const [classData] = await db
      .update(classes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return classData;
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Get classes filtered by organization
  async getClassesByOrganization(organizationId: string): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, organizationId));
  }

  // Get classes with teachers filtered by organization
  async getClassesWithTeachersByOrganization(organizationId: string): Promise<Array<Class & { teachers: User[] }>> {
    const orgClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.organizationId, organizationId));

    const classesWithTeachers = await Promise.all(
      orgClasses.map(async (cls) => {
        // Get all teachers assigned to this class via junction table
        const teacherAssignments = await db
          .select({ user: users })
          .from(teacherClasses)
          .innerJoin(users, eq(teacherClasses.teacherId, users.id))
          .where(eq(teacherClasses.classId, cls.id));

        return {
          ...cls,
          teachers: teacherAssignments.map(t => t.user),
        };
      })
    );

    return classesWithTeachers;
  }

  // Gate operations
  async getAllGates(): Promise<Gate[]> {
    return await db.select().from(gates);
  }

  async getGateById(id: string): Promise<Gate | undefined> {
    const [gate] = await db.select().from(gates).where(eq(gates.id, id));
    return gate;
  }

  async getActiveGates(): Promise<Gate[]> {
    return await db.select().from(gates).where(eq(gates.status, "active"));
  }

  async createGate(insertGate: InsertGate): Promise<Gate> {
    const [gate] = await db.insert(gates).values(insertGate).returning();
    return gate;
  }

  async updateGate(id: string, updateData: Partial<InsertGate>): Promise<Gate | undefined> {
    const [gate] = await db
      .update(gates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(gates.id, id))
      .returning();
    return gate;
  }

  async deleteGate(id: string): Promise<boolean> {
    const result = await db.delete(gates).where(eq(gates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Dismissal operations
  async getAllDismissals(): Promise<Dismissal[]> {
    return await db.select().from(dismissals);
  }

  async getDismissalById(id: string): Promise<Dismissal | undefined> {
    const [dismissal] = await db.select().from(dismissals).where(eq(dismissals.id, id));
    return dismissal;
  }

  async getDismissalsByStudent(studentId: string): Promise<Dismissal[]> {
    return await db.select().from(dismissals).where(eq(dismissals.studentId, studentId));
  }

  async getDismissalsByStatus(status: DismissalStatus): Promise<Dismissal[]> {
    return await db.select().from(dismissals).where(eq(dismissals.status, status));
  }

  async getDismissalsForTeacherClasses(teacherId: string): Promise<any[]> {
    // Get all classes assigned to this teacher
    const teacherClasses = await this.getTeacherClassAssignments(teacherId);
    const classIds = teacherClasses.map(c => c.id);
    
    if (classIds.length === 0) {
      return [];
    }

    // Get all students in these classes
    const studentsInClasses = await db
      .select()
      .from(students)
      .where(inArray(students.classId, classIds));
    
    const studentIds = studentsInClasses.map(s => s.id);
    
    if (studentIds.length === 0) {
      return [];
    }

    // Get dismissals for these students with joined data
    const dismissalsWithDetails = await db
      .select({
        id: dismissals.id,
        studentId: dismissals.studentId,
        parentId: dismissals.parentId,
        gateId: dismissals.gateId,
        status: dismissals.status,
        calledAt: dismissals.calledAt,
        completedAt: dismissals.completedAt,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
        studentGrade: students.grade,
        studentClass: students.class,
        parentFirstName: users.firstName,
        parentLastName: users.lastName,
        gateName: gates.name,
      })
      .from(dismissals)
      .innerJoin(students, eq(dismissals.studentId, students.id))
      .innerJoin(users, eq(dismissals.parentId, users.id))
      .leftJoin(gates, eq(dismissals.gateId, gates.id))
      .where(inArray(dismissals.studentId, studentIds));

    return dismissalsWithDetails;
  }

  async createDismissal(insertDismissal: InsertDismissal): Promise<Dismissal> {
    const [dismissal] = await db.insert(dismissals).values(insertDismissal).returning();
    return dismissal;
  }

  async updateDismissal(id: string, updateData: Partial<InsertDismissal>): Promise<Dismissal | undefined> {
    const [dismissal] = await db
      .update(dismissals)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(dismissals.id, id))
      .returning();
    return dismissal;
  }

  async deleteDismissal(id: string): Promise<boolean> {
    const result = await db.delete(dismissals).where(eq(dismissals.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Teacher-Class assignment operations
  async getTeacherClassAssignments(teacherId: string): Promise<Class[]> {
    const assignments = await db
      .select({
        class: classes,
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(teacherClasses.classId, classes.id))
      .where(eq(teacherClasses.teacherId, teacherId));
    
    return assignments.map(a => a.class);
  }

  async getClassTeacherAssignments(classId: string): Promise<User[]> {
    const assignments = await db
      .select({
        teacher: users,
      })
      .from(teacherClasses)
      .innerJoin(users, eq(teacherClasses.teacherId, users.id))
      .where(eq(teacherClasses.classId, classId));
    
    return assignments.map(a => a.teacher);
  }

  async createTeacherClassAssignment(assignment: InsertTeacherClass): Promise<TeacherClass> {
    const [teacherClass] = await db.insert(teacherClasses).values(assignment).returning();
    return teacherClass;
  }

  async deleteTeacherClassAssignment(teacherId: string, classId: string): Promise<boolean> {
    const result = await db
      .delete(teacherClasses)
      .where(
        and(
          eq(teacherClasses.teacherId, teacherId),
          eq(teacherClasses.classId, classId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteAllTeacherClassAssignments(teacherId: string): Promise<boolean> {
    const result = await db
      .delete(teacherClasses)
      .where(eq(teacherClasses.teacherId, teacherId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Fix existing students by assigning correct classId based on school, grade, and section
  async fixStudentClassIds(): Promise<{ updated: number; failed: number }> {
    const allStudents = await db.select().from(students);
    let updated = 0;
    let failed = 0;

    for (const student of allStudents) {
      const matchingClass = await db
        .select()
        .from(classes)
        .where(
          and(
            eq(classes.school, student.school),
            eq(classes.grade, student.grade),
            eq(classes.section, student.class)
          )
        )
        .limit(1);

      if (matchingClass.length > 0 && student.classId !== matchingClass[0].id) {
        await db
          .update(students)
          .set({ classId: matchingClass[0].id, updatedAt: new Date() })
          .where(eq(students.id, student.id));
        updated++;
      } else if (matchingClass.length === 0 && student.classId !== null) {
        // Class doesn't exist, set to null
        await db
          .update(students)
          .set({ classId: null, updatedAt: new Date() })
          .where(eq(students.id, student.id));
        failed++;
      }
    }

    return { updated, failed };
  }

  // Get dismissal statistics
  async getDismissalStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date(new Date().setHours(23, 59, 59, 999));

    // Get all dismissals in date range
    const allDismissals = await db
      .select()
      .from(dismissals)
      .where(
        and(
          dismissals.scannedAt ? dismissals.scannedAt >= start : undefined,
          dismissals.scannedAt ? dismissals.scannedAt <= end : undefined
        ) as any
      );

    // Calculate statistics
    const totalDismissals = allDismissals.length;
    const completedDismissals = allDismissals.filter(d => d.status === "completed").length;
    const pendingDismissals = allDismissals.filter(d => d.status === "called" || d.status === "in_progress").length;

    // Calculate average pickup time (from called to completed)
    const completedWithTime = allDismissals.filter(
      d => d.status === "completed" && d.calledAt && d.completedAt
    );

    let averagePickupTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, d) => {
        const called = new Date(d.calledAt!).getTime();
        const completed = new Date(d.completedAt!).getTime();
        return sum + (completed - called);
      }, 0);
      averagePickupTime = totalTime / completedWithTime.length / 1000 / 60; // Convert to minutes
    }

    return {
      totalDismissals,
      completedDismissals,
      pendingDismissals,
      averagePickupTimeMinutes: Math.round(averagePickupTime * 10) / 10,
      completionRate: totalDismissals > 0 ? Math.round((completedDismissals / totalDismissals) * 100) : 0,
    };
  }

  // Get gate statistics
  async getGateStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const end = endDate || new Date(new Date().setHours(23, 59, 59, 999));

    // Get dismissals by gate
    const dismissalsByGate = await db
      .select({
        gateId: dismissals.gateId,
        gateName: gates.name,
        count: dismissals.id,
      })
      .from(dismissals)
      .leftJoin(gates, eq(dismissals.gateId, gates.id))
      .where(
        and(
          dismissals.scannedAt ? dismissals.scannedAt >= start : undefined,
          dismissals.scannedAt ? dismissals.scannedAt <= end : undefined
        ) as any
      );

    // Group by gate
    const gateStats = dismissalsByGate.reduce((acc: any, row: any) => {
      const gateName = row.gateName || "Unknown";
      if (!acc[gateName]) {
        acc[gateName] = 0;
      }
      acc[gateName]++;
      return acc;
    }, {});

    return Object.entries(gateStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => b.count - a.count);
  }

  // Get dismissals by hour
  async getDismissalsByHour(date?: Date): Promise<any> {
    const targetDate = date || new Date();
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));

    const allDismissals = await db
      .select({
        scannedAt: dismissals.scannedAt,
      })
      .from(dismissals)
      .where(
        and(
          dismissals.scannedAt ? dismissals.scannedAt >= start : undefined,
          dismissals.scannedAt ? dismissals.scannedAt <= end : undefined
        ) as any
      );

    // Group by hour
    const hourlyStats: any = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = 0;
    }

    allDismissals.forEach((d: any) => {
      if (d.scannedAt) {
        const hour = new Date(d.scannedAt).getHours();
        hourlyStats[hour]++;
      }
    });

    return Object.entries(hourlyStats).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      label: `${hour}:00`,
    }));
  }

  // Get all students for an organization (for usage limit checking)
  async getStudentsByOrganization(organizationId: string) {
    return await db
      .select()
      .from(students)
      .where(eq(students.organizationId, organizationId));
  }

  // Get all staff (teacher, security, admin) for an organization (for usage limit checking)
  async getStaffByOrganization(organizationId: string) {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          or(
            eq(users.role, "teacher"),
            eq(users.role, "security"),
            eq(users.role, "admin")
          )
        )
      );
  }

  // Get all gates for an organization (for usage limit checking)
  async getGatesByOrganization(organizationId: string) {
    return await db
      .select()
      .from(gates)
      .where(eq(gates.organizationId, organizationId));
  }

  // Organization operations
  async getOrganizationById(organizationId: string): Promise<Organization | undefined> {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    return org;
  }
}

export const storage = new DbStorage();
