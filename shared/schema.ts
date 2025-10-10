import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles in the system
export const userRoles = ["parent", "teacher", "security", "admin"] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  phone: text("phone").unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  nfcCardId: text("nfc_card_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  phoneIdx: index("phone_idx").on(table.phone),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(userRoles),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Student genders
export const studentGenders = ["male", "female"] as const;
export type StudentGender = typeof studentGenders[number];

// Students table - children registered by parents
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  studentId: text("student_id").notNull(), // School's student ID
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(),
  gender: text("gender").notNull().$type<StudentGender>(),
  nfcCardId: text("nfc_card_id"), // Student's individual NFC card
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
  studentIdIdx: index("student_id_idx").on(table.studentId),
  nfcCardIdx: index("nfc_card_idx").on(table.nfcCardId),
}));

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Student name is required"),
  studentId: z.string().min(1, "Student ID is required"),
  school: z.string().min(1, "School is required"),
  grade: z.string().min(1, "Grade is required"),
  class: z.string().min(1, "Class is required"),
  gender: z.enum(studentGenders),
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
