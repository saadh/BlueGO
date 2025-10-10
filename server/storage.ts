import { type User, type InsertUser, type Student, type InsertStudent, users, students } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmailOrPhone(emailOrPhone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserNFCCard(userId: string, nfcCardId: string): Promise<User | undefined>;
  
  // Student operations
  getStudentsByParentId(parentId: string): Promise<Student[]>;
  getStudentById(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  
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
}

export const storage = new DbStorage();
