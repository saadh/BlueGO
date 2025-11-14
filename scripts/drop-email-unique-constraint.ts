import { pool } from "../server/db";

async function dropEmailUniqueConstraint() {
  console.log("🔧 Dropping old unique constraint on email field...");

  try {
    // Drop the old unique constraint on email
    await pool.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_email_key;
    `);
    console.log("✅ Successfully dropped users_email_key constraint");

    // Drop the old unique constraint on phone (if it exists)
    await pool.query(`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_phone_key;
    `);
    console.log("✅ Successfully dropped users_phone_key constraint");

    // Verify the composite unique index exists
    const indexCheck = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'email_org_unique';
    `);

    if (indexCheck.rows.length > 0) {
      console.log("✅ Composite unique index 'email_org_unique' exists");
    } else {
      console.warn("⚠️  Composite unique index 'email_org_unique' NOT found!");
      console.log("   Run 'npm run db:push' to create it from the schema");
    }

    console.log("\n✨ Migration complete! Multi-school parents are now supported.");
    console.log("   - Same email can exist in multiple organizations");
    console.log("   - Same email cannot exist twice in the same organization");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropEmailUniqueConstraint();
