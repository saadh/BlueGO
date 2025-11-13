import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

// Create initial admin account if it doesn't exist
export async function seedAdminAccount() {
  try {
    console.log("Checking for admin account...");

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@bluego.com"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin account already exists (admin@bluego.com)");
      return;
    }

    // Create admin account
    const hashedPassword = await hashPassword("admin123");

    await db.insert(users).values({
      email: "admin@bluego.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    console.log("✅ Initial admin account created successfully!");
    console.log("   Email: admin@bluego.com");
    console.log("   Password: admin123");
    console.log("   ⚠️  Please change this password after first login!");
  } catch (error) {
    console.error("❌ Failed to seed admin account:", error);
  }
}
