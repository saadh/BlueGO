import { db } from "./db";
import { sql } from "drizzle-orm";

// SQL to create all tables based on the schema
const createTablesSQL = `
-- Organizations table (must be created first due to foreign keys)
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  logo_url TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'trial',
  subscription_started_at TIMESTAMP DEFAULT NOW(),
  subscription_ends_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  billing_email TEXT,
  max_students TEXT DEFAULT '100',
  max_staff TEXT DEFAULT '10',
  is_active BOOLEAN NOT NULL DEFAULT true,
  suspended_at TIMESTAMP,
  suspended_reason TEXT,
  features_enabled JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id VARCHAR
);

CREATE INDEX IF NOT EXISTS org_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS org_status_idx ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS org_active_idx ON organizations(is_active);

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  max_students TEXT NOT NULL DEFAULT '500',
  max_staff TEXT NOT NULL DEFAULT '25',
  max_gates TEXT NOT NULL DEFAULT '10',
  features JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order TEXT DEFAULT '0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_slug_idx ON subscription_plans(slug);

-- Users table (updated with multi-tenancy)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  nfc_card_id TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_at TIMESTAMP,
  suspended_by_user_id VARCHAR,
  suspended_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS phone_idx ON users(phone);
CREATE INDEX IF NOT EXISTS user_organization_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS user_role_idx ON users(role);

-- Classes table (updated with multi-tenancy)
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  room_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS class_organization_idx ON classes(organization_id);
CREATE INDEX IF NOT EXISTS class_school_idx ON classes(school);
CREATE INDEX IF NOT EXISTS class_teacher_idx ON classes(teacher_id);

-- Teacher Classes junction table
CREATE TABLE IF NOT EXISTS teacher_classes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id VARCHAR NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS teacher_class_teacher_idx ON teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS teacher_class_class_idx ON teacher_classes(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_teacher_class_idx ON teacher_classes(teacher_id, class_id);

-- Students table (updated with multi-tenancy)
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id VARCHAR REFERENCES classes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  class TEXT NOT NULL,
  gender TEXT NOT NULL,
  avatar_url TEXT,
  nfc_card_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_organization_idx ON students(organization_id);
CREATE INDEX IF NOT EXISTS parent_idx ON students(parent_id);
CREATE INDEX IF NOT EXISTS student_class_idx ON students(class_id);
CREATE INDEX IF NOT EXISTS student_id_idx ON students(student_id);
CREATE INDEX IF NOT EXISTS nfc_card_idx ON students(nfc_card_id);

-- Gates table (updated with multi-tenancy)
CREATE TABLE IF NOT EXISTS gates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gate_organization_idx ON gates(organization_id);
CREATE INDEX IF NOT EXISTS gate_status_idx ON gates(status);

-- Dismissals table (updated with multi-tenancy)
CREATE TABLE IF NOT EXISTS dismissals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id VARCHAR NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id VARCHAR NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gate_id VARCHAR REFERENCES gates(id) ON DELETE SET NULL,
  scanned_by_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scanned_at TIMESTAMP DEFAULT NOW(),
  called_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dismissal_organization_idx ON dismissals(organization_id);
CREATE INDEX IF NOT EXISTS dismissal_student_idx ON dismissals(student_id);
CREATE INDEX IF NOT EXISTS dismissal_parent_idx ON dismissals(parent_id);
CREATE INDEX IF NOT EXISTS dismissal_gate_idx ON dismissals(gate_id);
CREATE INDEX IF NOT EXISTS dismissal_scanned_by_idx ON dismissals(scanned_by_user_id);
CREATE INDEX IF NOT EXISTS dismissal_status_idx ON dismissals(status);
CREATE INDEX IF NOT EXISTS dismissal_scanned_at_idx ON dismissals(scanned_at);
`;

export async function initializeDatabase() {
  try {
    console.log("Initializing database tables...");

    // Execute the SQL to create tables
    await db.execute(sql.raw(createTablesSQL));

    console.log("✅ Database tables created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}
