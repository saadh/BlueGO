import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkSchema() {
  try {
    console.log("Checking database schema...\n");

    // Check if organization_id column exists in users table
    const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'organization_id'
    `);

    console.log("✓ organization_id column exists:", result.rows.length > 0);

    // Check if superadmin exists
    const superadmin = await db.execute(sql`
      SELECT email, role, first_name, last_name
      FROM users
      WHERE email = 'superadmin@bluego.com'
    `);

    console.log("✓ Superadmin exists:", superadmin.rows.length > 0);
    if (superadmin.rows.length > 0) {
      console.log("  Superadmin details:", superadmin.rows[0]);
    }

    // Check subscription plans
    const plans = await db.execute(sql`
      SELECT slug, name FROM subscription_plans
    `);

    console.log("\n✓ Subscription plans created:", plans.rows.length);
    if (plans.rows.length > 0) {
      console.log("  Plans:", plans.rows.map((p: any) => p.slug).join(", "));
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkSchema();
