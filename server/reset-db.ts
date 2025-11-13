import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * Reset database - drops all tables and recreates them
 * WARNING: This will delete ALL data in the database!
 */

const dropTablesSQL = `
-- Drop all tables in reverse order (to handle foreign key constraints)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS dismissals CASCADE;
DROP TABLE IF EXISTS gates CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teacher_classes CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
`;

async function resetDatabase() {
  try {
    console.log("⚠️  WARNING: This will delete ALL data in the database!");
    console.log("Dropping all tables...");

    // Drop all tables
    await db.execute(sql.raw(dropTablesSQL));

    console.log("✅ All tables dropped successfully!");
    console.log("\nNow run the server to recreate the tables with the new schema.");
    console.log("The initialization will run automatically on server startup.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

resetDatabase();
