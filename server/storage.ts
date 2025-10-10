import { 
  type User, type InsertUser, type UserRole,
  type Student, type InsertStudent,
  type Class, type InsertClass,
  type Gate, type InsertGate, type GateStatus,
  type Dismissal, type InsertDismissal, type DismissalStatus,
  users, students, classes, gates, dismissals
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
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
  createDismissal(dismissal: InsertDismissal): Promise<Dismissal>;
  updateDismissal(id: string, dismissal: Partial<InsertDismissal>): Promise<Dismissal | undefined>;
  deleteDismissal(id: string): Promise<boolean>;
  
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
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async updateStudent(id: string, updateData: Partial<InsertStudent>): Promise<Student | undefined> {
    const [student] = await db
      .update(students)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student;
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
}

export const storage = new DbStorage();
