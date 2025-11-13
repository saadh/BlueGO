import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

// Create initial superadmin account if it doesn't exist
// Superadmin manages all organizations and has platform-wide access
export async function seedSuperadminAccount() {
  try {
    console.log("Checking for superadmin account...");

    // Check if superadmin already exists
    const existingSuperadmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "superadmin@bluego.com"))
      .limit(1);

    if (existingSuperadmin.length > 0) {
      console.log("✅ Superadmin account already exists (superadmin@bluego.com)");
      return;
    }

    // Create superadmin account (no organizationId - platform-wide access)
    const hashedPassword = await hashPassword("superadmin123");

    await db.insert(users).values({
      email: "superadmin@bluego.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "superadmin",
      organizationId: null, // Superadmin is not tied to any organization
    });

    console.log("✅ Initial superadmin account created successfully!");
    console.log("   Email: superadmin@bluego.com");
    console.log("   Password: superadmin123");
    console.log("   Role: superadmin (platform-wide access)");
    console.log("   ⚠️  Please change this password after first login!");
  } catch (error) {
    console.error("❌ Failed to seed superadmin account:", error);
  }
}
