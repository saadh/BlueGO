import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, uniqueIndex, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription statuses
export const subscriptionStatuses = ["active", "suspended", "cancelled", "trial", "expired"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

// Organizations (Schools) table - Multi-tenant support
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain").unique(),
  logoUrl: text("logo_url"),

  // Contact Info
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),

  // Subscription & Billing
  subscriptionStatus: text("subscription_status").notNull().$type<SubscriptionStatus>().default("trial"),
  subscriptionPlan: text("subscription_plan").default("trial"), // trial, basic, premium, enterprise
  subscriptionStartedAt: timestamp("subscription_started_at").defaultNow(),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  billingEmail: text("billing_email"),
  maxStudents: text("max_students").default("100"), // stored as text for "unlimited"
  maxStaff: text("max_staff").default("10"),

  // Status & Access
  isActive: boolean("is_active").notNull().default(true),
  suspendedAt: timestamp("suspended_at"),
  suspendedReason: text("suspended_reason"),
  featuresEnabled: jsonb("features_enabled").$type<Record<string, boolean>>(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdByUserId: varchar("created_by_user_id"),
}, (table) => ({
  slugIdx: index("org_slug_idx").on(table.slug),
  statusIdx: index("org_status_idx").on(table.subscriptionStatus),
  activeIdx: index("org_active_idx").on(table.isActive),
}));

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  subscriptionStatus: z.enum(subscriptionStatuses).default("trial"),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),

  // Pricing
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),

  // Limits
  maxStudents: text("max_students").notNull().default("500"),
  maxStaff: text("max_staff").notNull().default("25"),
  maxGates: text("max_gates").notNull().default("10"),

  // Features
  features: jsonb("features").$type<Record<string, boolean>>().notNull(),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: text("display_order").default("0"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("plan_slug_idx").on(table.slug),
}));

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User roles in the system - NOW INCLUDING SUPERADMIN
export const userRoles = ["superadmin", "admin", "teacher", "security", "parent"] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }), // null for superadmin
  email: text("email").unique(),
  phone: text("phone").unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  nfcCardId: text("nfc_card_id"),

  // Suspension capability
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspendedAt: timestamp("suspended_at"),
  suspendedByUserId: varchar("suspended_by_user_id"),
  suspendedReason: text("suspended_reason"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  phoneIdx: index("phone_idx").on(table.phone),
  organizationIdx: index("user_organization_idx").on(table.organizationId),
  roleIdx: index("user_role_idx").on(table.role),
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
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(), // e.g., "A", "B", "C"
  teacherId: varchar("teacher_id").references(() => users.id, { onDelete: "set null" }),
  roomNumber: text("room_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  organizationIdx: index("class_organization_idx").on(table.organizationId),
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
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  classId: varchar("class_id").references(() => classes.id, { onDelete: "set null" }), // Link to classes table
  name: text("name").notNull(),
  studentId: text("student_id").notNull(), // School's student ID
  school: text("school").notNull(),
  grade: text("grade").notNull(),
  class: text("class").notNull(), // Section (temporary, will use classId)
  gender: text("gender").notNull().$type<StudentGender>(),
  avatarUrl: text("avatar_url"), // Custom avatar URL or preset avatar identifier
  nfcCardId: text("nfc_card_id"), // Student's individual NFC card
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  organizationIdx: index("student_organization_idx").on(table.organizationId),
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
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().$type<GateStatus>().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  organizationIdx: index("gate_organization_idx").on(table.organizationId),
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
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
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
  organizationIdx: index("dismissal_organization_idx").on(table.organizationId),
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

// Audit log actions
export const auditActions = [
  "organization.created",
  "organization.updated",
  "organization.suspended",
  "organization.activated",
  "organization.deleted",
  "user.created",
  "user.updated",
  "user.suspended",
  "user.unsuspended",
  "user.deleted",
  "subscription.upgraded",
  "subscription.renewed",
  "subscription.cancelled",
  "trial.extended",
  "admin.created",
] as const;
export type AuditAction = typeof auditActions[number];

// Audit logs table - tracks all superadmin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull().$type<AuditAction>(),
  targetType: text("target_type").notNull(), // organization, user, subscription, etc.
  targetId: varchar("target_id"), // ID of the affected resource
  targetName: text("target_name"), // Name of the affected resource for easy reference
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }), // Organization context
  metadata: jsonb("metadata").$type<Record<string, any>>(), // Additional contextual data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("audit_user_idx").on(table.userId),
  actionIdx: index("audit_action_idx").on(table.action),
  targetIdx: index("audit_target_idx").on(table.targetType, table.targetId),
  organizationIdx: index("audit_organization_idx").on(table.organizationId),
  createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
