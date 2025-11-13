import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed default subscription plans
 * Creates trial, starter, professional, and enterprise plans
 */
export async function seedSubscriptionPlans() {
  try {
    console.log("Seeding subscription plans...");

    const plans = [
      {
        name: "Trial",
        slug: "trial",
        description: "30-day free trial with limited features",
        priceMonthly: "0.00",
        priceYearly: "0.00",
        maxStudents: "50",
        maxStaff: "5",
        maxGates: "2",
        features: {
          "real_time_updates": true,
          "sound_notifications": true,
          "statistics_dashboard": true,
          "custom_avatars": true,
          "nfc_scanning": true,
          "multi_gate": false,
          "priority_support": false,
          "custom_branding": false,
          "api_access": false,
          "advanced_analytics": false,
        },
        isActive: true,
        displayOrder: "1",
      },
      {
        name: "Starter",
        slug: "starter",
        description: "Perfect for small schools",
        priceMonthly: "99.00",
        priceYearly: "990.00",
        maxStudents: "200",
        maxStaff: "10",
        maxGates: "3",
        features: {
          "real_time_updates": true,
          "sound_notifications": true,
          "statistics_dashboard": true,
          "custom_avatars": true,
          "nfc_scanning": true,
          "multi_gate": true,
          "priority_support": false,
          "custom_branding": false,
          "api_access": false,
          "advanced_analytics": false,
        },
        isActive: true,
        displayOrder: "2",
      },
      {
        name: "Professional",
        slug: "professional",
        description: "For growing schools with advanced needs",
        priceMonthly: "249.00",
        priceYearly: "2490.00",
        maxStudents: "500",
        maxStaff: "25",
        maxGates: "5",
        features: {
          "real_time_updates": true,
          "sound_notifications": true,
          "statistics_dashboard": true,
          "custom_avatars": true,
          "nfc_scanning": true,
          "multi_gate": true,
          "priority_support": true,
          "custom_branding": true,
          "api_access": false,
          "advanced_analytics": true,
        },
        isActive: true,
        displayOrder: "3",
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        description: "Unlimited features for large institutions",
        priceMonthly: "499.00",
        priceYearly: "4990.00",
        maxStudents: "unlimited",
        maxStaff: "unlimited",
        maxGates: "unlimited",
        features: {
          "real_time_updates": true,
          "sound_notifications": true,
          "statistics_dashboard": true,
          "custom_avatars": true,
          "nfc_scanning": true,
          "multi_gate": true,
          "priority_support": true,
          "custom_branding": true,
          "api_access": true,
          "advanced_analytics": true,
        },
        isActive: true,
        displayOrder: "4",
      },
    ];

    for (const plan of plans) {
      // Check if plan already exists
      const [existingPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.slug, plan.slug))
        .limit(1);

      if (existingPlan) {
        console.log(`✓ Plan "${plan.name}" already exists`);
        continue;
      }

      // Create plan
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✓ Created plan: ${plan.name} ($${plan.priceMonthly}/mo)`);
    }

    console.log("✅ Subscription plans seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to seed subscription plans:", error);
  }
}
