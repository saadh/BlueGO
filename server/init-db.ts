import { db } from "./db";
import { sql } from "drizzle-orm";

// SQL to create all tables based on the schema
const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL,
  nfc_card_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_idx ON users(email);
CREATE INDEX IF NOT EXISTS phone_idx ON users(phone);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school TEXT NOT NULL,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  room_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

CREATE INDEX IF NOT EXISTS parent_idx ON students(parent_id);
CREATE INDEX IF NOT EXISTS student_class_idx ON students(class_id);
CREATE INDEX IF NOT EXISTS student_id_idx ON students(student_id);
CREATE INDEX IF NOT EXISTS nfc_card_idx ON students(nfc_card_id);

-- Gates table
CREATE TABLE IF NOT EXISTS gates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gate_status_idx ON gates(status);

-- Dismissals table
CREATE TABLE IF NOT EXISTS dismissals (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
