import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
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

// Classes table - represents classrooms with teacher assignments
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(), // e.g., "A", "B", "C"
  teacherId: varchar("teacher_id").references(() => users.id, { onDelete: "set null" }),
  roomNumber: text("room_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  schoolIdx: index("class_school_idx").on(table.school),
  teacherIdx: index("class_teacher_idx").on(table.teacherId),
}));

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  school: z.string().min(1, "School is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  roomNumber: z.string().optional(),
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Teacher-Class assignments junction table (many-to-many)
export const teacherClasses = pgTable("teacher_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  teacherIdx: index("teacher_class_teacher_idx").on(table.teacherId),
  classIdx: index("teacher_class_class_idx").on(table.classId),
  // Unique constraint to prevent duplicate assignments
  uniqueTeacherClass: uniqueIndex("unique_teacher_class_idx").on(table.teacherId, table.classId),
}));

export const insertTeacherClassSchema = createInsertSchema(teacherClasses).omit({
  id: true,
  createdAt: true,
}).extend({
  teacherId: z.string().min(1, "Teacher ID is required"),
  classId: z.string().min(1, "Class ID is required"),
});

export type InsertTeacherClass = z.infer<typeof insertTeacherClassSchema>;
export type TeacherClass = typeof teacherClasses.$inferSelect;

// Student genders
export const studentGenders = ["male", "female"] as const;
export type StudentGender = typeof studentGenders[number];

// Students table - children registered by parents
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: varchar("class_id").references(() => classes.id, { onDelete: "set null" }), // Link to classes table
  name: text("name").notNull(),
  studentId: text("student_id").notNull(), // School's student ID
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(), // Section (temporary, will use classId)
  gender: text("gender").notNull().$type<StudentGender>(),
  nfcCardId: text("nfc_card_id"), // Student's individual NFC card
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentIdx: index("parent_idx").on(table.parentId),
  classIdx: index("student_class_idx").on(table.classId),
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

// Gate statuses
export const gateStatuses = ["active", "inactive"] as const;
export type GateStatus = typeof gateStatuses[number];

// Gates table - security checkpoints where parents scan NFC cards
export const gates = pgTable("gates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().$type<GateStatus>().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("gate_status_idx").on(table.status),
}));

export const insertGateSchema = createInsertSchema(gates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Gate name is required"),
  location: z.string().min(1, "Location is required"),
  status: z.enum(gateStatuses).default("active"),
});

export type InsertGate = z.infer<typeof insertGateSchema>;
export type Gate = typeof gates.$inferSelect;

// Dismissal statuses
export const dismissalStatuses = ["pending", "called", "in_progress", "completed", "cancelled"] as const;
export type DismissalStatus = typeof dismissalStatuses[number];

// Dismissals table - tracks parent arrivals and student pickups
export const dismissals = pgTable("dismissals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gateId: varchar("gate_id").references(() => gates.id, { onDelete: "set null" }),
  scannedByUserId: varchar("scanned_by_user_id").references(() => users.id, { onDelete: "set null" }), // Security staff who scanned
  status: text("status").notNull().$type<DismissalStatus>().default("pending"),
  scannedAt: timestamp("scanned_at").defaultNow(), // When parent card was scanned
  calledAt: timestamp("called_at"), // When classroom was notified
  completedAt: timestamp("completed_at"), // When student was picked up
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  studentIdx: index("dismissal_student_idx").on(table.studentId),
  parentIdx: index("dismissal_parent_idx").on(table.parentId),
  gateIdx: index("dismissal_gate_idx").on(table.gateId),
  scannedByIdx: index("dismissal_scanned_by_idx").on(table.scannedByUserId),
  statusIdx: index("dismissal_status_idx").on(table.status),
  scannedAtIdx: index("dismissal_scanned_at_idx").on(table.scannedAt),
}));

export const insertDismissalSchema = createInsertSchema(dismissals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  studentId: z.string().min(1, "Student is required"),
  parentId: z.string().min(1, "Parent is required"),
  status: z.enum(dismissalStatuses).default("pending"),
});

export type InsertDismissal = z.infer<typeof insertDismissalSchema>;
export type Dismissal = typeof dismissals.$inferSelect;
