import { Express } from "express";
import { db } from "./db";
import { organizations, users, insertOrganizationSchema, Organization } from "@shared/schema";
import { eq, desc, and, or, like, count, sql } from "drizzle-orm";
import { isAuthenticated, hasRole } from "./auth";

/**
 * Organization management APIs for superadmin
 * Handles CRUD operations for organizations (schools)
 */
export function setupOrganizationRoutes(app: Express) {
  /**
   * GET /api/superadmin/organizations
   * List all organizations with filtering and pagination
   */
  app.get(
    "/api/superadmin/organizations",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const {
          page = "1",
          limit = "20",
          search = "",
          status = "",
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        // Build filters
        const filters = [];
        if (search) {
          filters.push(
            or(
              like(organizations.name, `%${search}%`),
              like(organizations.slug, `%${search}%`),
              like(organizations.contactEmail, `%${search}%`)
            )
          );
        }
        if (status) {
          filters.push(eq(organizations.subscriptionStatus, status as any));
        }

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(organizations)
          .where(filters.length > 0 ? and(...filters) : undefined);

        // Get organizations
        const orgs = await db
          .select()
          .from(organizations)
          .where(filters.length > 0 ? and(...filters) : undefined)
          .orderBy(desc(organizations.createdAt))
          .limit(limitNum)
          .offset(offset);

        res.json({
          organizations: orgs,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total || 0,
            totalPages: Math.ceil((total || 0) / limitNum),
          },
        });
      } catch (error) {
        console.error("Error fetching organizations:", error);
        res.status(500).json({ message: "Failed to fetch organizations" });
      }
    }
  );

  /**
   * GET /api/superadmin/organizations/:id
   * Get single organization by ID
   */
  app.get(
    "/api/superadmin/organizations/:id",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Get user counts
        const [{ adminCount }] = await db
          .select({ adminCount: count() })
          .from(users)
          .where(
            and(
              eq(users.organizationId, id),
              eq(users.role, "admin")
            )
          );

        const [{ staffCount }] = await db
          .select({ staffCount: count() })
          .from(users)
          .where(
            and(
              eq(users.organizationId, id),
              or(eq(users.role, "teacher"), eq(users.role, "security"))
            )
          );

        const [{ parentCount }] = await db
          .select({ parentCount: count() })
          .from(users)
          .where(
            and(
              eq(users.organizationId, id),
              eq(users.role, "parent")
            )
          );

        res.json({
          ...org,
          stats: {
            admins: adminCount || 0,
            staff: staffCount || 0,
            parents: parentCount || 0,
          },
        });
      } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).json({ message: "Failed to fetch organization" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations
   * Create new organization
   */
  app.post(
    "/api/superadmin/organizations",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const validatedData = insertOrganizationSchema.parse(req.body);

        // Check if slug is already taken
        const [existingOrg] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, validatedData.slug))
          .limit(1);

        if (existingOrg) {
          return res.status(400).json({
            message: "Organization slug already exists",
          });
        }

        // Set trial period (30 days from now)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);

        const [newOrg] = await db
          .insert(organizations)
          .values({
            ...validatedData,
            trialEndsAt,
            createdByUserId: req.user!.id,
          })
          .returning();

        res.status(201).json(newOrg);
      } catch (error: any) {
        console.error("Error creating organization:", error);
        if (error.name === "ZodError") {
          return res.status(400).json({
            message: "Validation error",
            errors: error.errors,
          });
        }
        res.status(500).json({ message: "Failed to create organization" });
      }
    }
  );

  /**
   * PATCH /api/superadmin/organizations/:id
   * Update organization details
   */
  app.patch(
    "/api/superadmin/organizations/:id",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const updateData: Partial<Organization> = {
          ...req.body,
          updatedAt: new Date(),
        };

        // Don't allow updating id or createdAt
        delete (updateData as any).id;
        delete (updateData as any).createdAt;

        const [updatedOrg] = await db
          .update(organizations)
          .set(updateData)
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({ message: "Failed to update organization" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:id/suspend
   * Suspend organization (block access)
   */
  app.post(
    "/api/superadmin/organizations/:id/suspend",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const [updatedOrg] = await db
          .update(organizations)
          .set({
            isActive: false,
            suspendedAt: new Date(),
            suspendedReason: reason || "Suspended by administrator",
            subscriptionStatus: "suspended",
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error suspending organization:", error);
        res.status(500).json({ message: "Failed to suspend organization" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:id/activate
   * Activate organization (restore access)
   */
  app.post(
    "/api/superadmin/organizations/:id/activate",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const [updatedOrg] = await db
          .update(organizations)
          .set({
            isActive: true,
            suspendedAt: null,
            suspendedReason: null,
            subscriptionStatus: "active",
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error activating organization:", error);
        res.status(500).json({ message: "Failed to activate organization" });
      }
    }
  );

  /**
   * DELETE /api/superadmin/organizations/:id
   * Delete organization and all associated data (DANGEROUS!)
   */
  app.delete(
    "/api/superadmin/organizations/:id",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { confirm } = req.body;

        if (confirm !== "DELETE") {
          return res.status(400).json({
            message: 'Please confirm deletion by sending { "confirm": "DELETE" }',
          });
        }

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Delete organization (cascade will delete all related data)
        await db.delete(organizations).where(eq(organizations.id, id));

        res.json({
          message: "Organization deleted successfully",
          organizationName: org.name,
        });
      } catch (error) {
        console.error("Error deleting organization:", error);
        res.status(500).json({ message: "Failed to delete organization" });
      }
    }
  );

  /**
   * GET /api/superadmin/organizations/:id/users
   * Get all users for an organization
   */
  app.get(
    "/api/superadmin/organizations/:id/users",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { role = "" } = req.query;

        const filters = [eq(users.organizationId, id)];
        if (role) {
          filters.push(eq(users.role, role as any));
        }

        const orgUsers = await db
          .select({
            id: users.id,
            email: users.email,
            phone: users.phone,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            isSuspended: users.isSuspended,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(and(...filters))
          .orderBy(desc(users.createdAt));

        res.json({ users: orgUsers });
      } catch (error) {
        console.error("Error fetching organization users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:id/extend-trial
   * Extend trial period for an organization
   */
  app.post(
    "/api/superadmin/organizations/:id/extend-trial",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { days } = req.body;

        if (!days || days <= 0) {
          return res.status(400).json({
            message: "Please provide a valid number of days to extend",
          });
        }

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Calculate new trial end date
        const currentTrialEnd = org.trialEndsAt || new Date();
        const newTrialEnd = new Date(currentTrialEnd);
        newTrialEnd.setDate(newTrialEnd.getDate() + days);

        const [updatedOrg] = await db
          .update(organizations)
          .set({
            trialEndsAt: newTrialEnd,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error extending trial:", error);
        res.status(500).json({ message: "Failed to extend trial" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:id/upgrade
   * Upgrade organization to a paid plan
   */
  app.post(
    "/api/superadmin/organizations/:id/upgrade",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { planSlug, billingCycle } = req.body;

        if (!planSlug || !billingCycle) {
          return res.status(400).json({
            message: "Plan slug and billing cycle are required",
          });
        }

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Get the plan details
        const { subscriptionPlans } = await import("@shared/schema");
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.slug, planSlug))
          .limit(1);

        if (!plan) {
          return res.status(404).json({ message: "Plan not found" });
        }

        // Calculate subscription end date based on billing cycle
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = new Date();

        if (billingCycle === "monthly") {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        } else if (billingCycle === "yearly") {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          return res.status(400).json({
            message: "Invalid billing cycle. Must be 'monthly' or 'yearly'",
          });
        }

        const [updatedOrg] = await db
          .update(organizations)
          .set({
            subscriptionStatus: "active",
            subscriptionPlan: planSlug,
            subscriptionStartedAt: subscriptionStartDate,
            subscriptionEndsAt: subscriptionEndDate,
            maxStudents: plan.maxStudents,
            maxStaff: plan.maxStaff,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error upgrading organization:", error);
        res.status(500).json({ message: "Failed to upgrade organization" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:id/renew
   * Renew subscription for an organization
   */
  app.post(
    "/api/superadmin/organizations/:id/renew",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { billingCycle } = req.body;

        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, id))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Calculate new subscription end date
        const newEndDate = new Date(org.subscriptionEndsAt || new Date());

        if (billingCycle === "monthly") {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else if (billingCycle === "yearly") {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        } else {
          return res.status(400).json({
            message: "Invalid billing cycle. Must be 'monthly' or 'yearly'",
          });
        }

        const [updatedOrg] = await db
          .update(organizations)
          .set({
            subscriptionStatus: "active",
            subscriptionEndsAt: newEndDate,
            isActive: true,
            suspendedAt: null,
            suspendedReason: null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, id))
          .returning();

        res.json(updatedOrg);
      } catch (error) {
        console.error("Error renewing subscription:", error);
        res.status(500).json({ message: "Failed to renew subscription" });
      }
    }
  );
}
