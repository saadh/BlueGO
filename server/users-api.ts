import { Express } from "express";
import { db } from "./db";
import { users, organizations } from "@shared/schema";
import { eq, desc, and, or, like, count, sql, isNull } from "drizzle-orm";
import { isAuthenticated, hasRole, hashPassword } from "./auth";
import { AuditLogger } from "./audit-logger";

/**
 * Cross-organization user management APIs for superadmin
 * Handles viewing, suspending, and managing users across all organizations
 */
export function setupUserManagementRoutes(app: Express) {
  /**
   * GET /api/superadmin/users
   * List all users across all organizations with filtering
   */
  app.get(
    "/api/superadmin/users",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const {
          page = "1",
          limit = "20",
          search = "",
          role = "",
          organizationId = "",
          suspended = "",
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        // Build filters
        const filters = [];

        // Exclude superadmins from the list (only show org users)
        filters.push(sql`${users.role} != 'superadmin'`);

        if (search) {
          filters.push(
            or(
              like(users.firstName, `%${search}%`),
              like(users.lastName, `%${search}%`),
              like(users.email, `%${search}%`),
              like(users.phone, `%${search}%`)
            )
          );
        }
        if (role) {
          filters.push(eq(users.role, role as any));
        }
        if (organizationId) {
          filters.push(eq(users.organizationId, organizationId as string));
        }
        if (suspended === "true") {
          filters.push(eq(users.isSuspended, true));
        } else if (suspended === "false") {
          filters.push(eq(users.isSuspended, false));
        }

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(users)
          .where(filters.length > 0 ? and(...filters) : undefined);

        // Get users with organization info
        const usersList = await db
          .select({
            id: users.id,
            email: users.email,
            phone: users.phone,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            organizationId: users.organizationId,
            organizationName: organizations.name,
            isSuspended: users.isSuspended,
            suspendedAt: users.suspendedAt,
            suspendedReason: users.suspendedReason,
            createdAt: users.createdAt,
          })
          .from(users)
          .leftJoin(organizations, eq(users.organizationId, organizations.id))
          .where(filters.length > 0 ? and(...filters) : undefined)
          .orderBy(desc(users.createdAt))
          .limit(limitNum)
          .offset(offset);

        res.json({
          users: usersList,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total || 0,
            totalPages: Math.ceil((total || 0) / limitNum),
          },
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  /**
   * GET /api/superadmin/users/:id
   * Get single user by ID with detailed information
   */
  app.get(
    "/api/superadmin/users/:id",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            phone: users.phone,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            organizationId: users.organizationId,
            organizationName: organizations.name,
            nfcCardId: users.nfcCardId,
            isSuspended: users.isSuspended,
            suspendedAt: users.suspendedAt,
            suspendedByUserId: users.suspendedByUserId,
            suspendedReason: users.suspendedReason,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .leftJoin(organizations, eq(users.organizationId, organizations.id))
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  /**
   * POST /api/superadmin/users/:id/suspend
   * Suspend a user account (blocks login)
   */
  app.post(
    "/api/superadmin/users/:id/suspend",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Don't allow suspending other superadmins
        if (user.role === "superadmin") {
          return res.status(403).json({
            message: "Cannot suspend superadmin accounts",
          });
        }

        const [updatedUser] = await db
          .update(users)
          .set({
            isSuspended: true,
            suspendedAt: new Date(),
            suspendedByUserId: req.user!.id,
            suspendedReason: reason || "Suspended by platform administrator",
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();

        // Log audit event
        await AuditLogger.logUserSuspended(
          req,
          updatedUser.id,
          `${updatedUser.firstName} ${updatedUser.lastName}`,
          reason || "Suspended by platform administrator",
          updatedUser.organizationId
        );

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error suspending user:", error);
        res.status(500).json({ message: "Failed to suspend user" });
      }
    }
  );

  /**
   * POST /api/superadmin/users/:id/unsuspend
   * Unsuspend a user account (restore access)
   */
  app.post(
    "/api/superadmin/users/:id/unsuspend",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const [updatedUser] = await db
          .update(users)
          .set({
            isSuspended: false,
            suspendedAt: null,
            suspendedByUserId: null,
            suspendedReason: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();

        // Log audit event
        await AuditLogger.logUserUnsuspended(
          req,
          updatedUser.id,
          `${updatedUser.firstName} ${updatedUser.lastName}`,
          updatedUser.organizationId
        );

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error unsuspending user:", error);
        res.status(500).json({ message: "Failed to unsuspend user" });
      }
    }
  );

  /**
   * POST /api/superadmin/organizations/:orgId/create-admin
   * Create an admin user for a specific organization
   */
  app.post(
    "/api/superadmin/organizations/:orgId/create-admin",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { orgId } = req.params;
        const { email, phone, password, firstName, lastName } = req.body;

        // Verify organization exists
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);

        if (!org) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Validate input
        if (!email && !phone) {
          return res.status(400).json({
            message: "Either email or phone is required",
          });
        }

        if (!password || !firstName || !lastName) {
          return res.status(400).json({
            message: "Password, first name, and last name are required",
          });
        }

        // Check if user already exists
        const existingUserFilters = [];
        if (email) {
          existingUserFilters.push(eq(users.email, email));
        }
        if (phone) {
          existingUserFilters.push(eq(users.phone, phone));
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(or(...existingUserFilters))
          .limit(1);

        if (existingUser) {
          return res.status(400).json({
            message: "User with this email or phone already exists",
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create admin user
        const [newUser] = await db
          .insert(users)
          .values({
            organizationId: orgId,
            email: email || null,
            phone: phone || null,
            password: hashedPassword,
            firstName,
            lastName,
            role: "admin",
          })
          .returning();

        // Log audit event
        await AuditLogger.logAdminCreated(
          req,
          newUser.id,
          `${newUser.firstName} ${newUser.lastName}`,
          org.name,
          orgId
        );

        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      } catch (error: any) {
        console.error("Error creating admin user:", error);
        res.status(500).json({ message: "Failed to create admin user" });
      }
    }
  );

  /**
   * DELETE /api/superadmin/users/:id
   * Delete a user account (DANGEROUS - removes all associated data)
   */
  app.delete(
    "/api/superadmin/users/:id",
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

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Don't allow deleting superadmins
        if (user.role === "superadmin") {
          return res.status(403).json({
            message: "Cannot delete superadmin accounts",
          });
        }

        // Delete user (cascade will delete related data)
        await db.delete(users).where(eq(users.id, id));

        res.json({
          message: "User deleted successfully",
          userName: `${user.firstName} ${user.lastName}`,
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  /**
   * PATCH /api/superadmin/users/:id
   * Update user details
   */
  app.patch(
    "/api/superadmin/users/:id",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, role } = req.body;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Don't allow modifying superadmins
        if (user.role === "superadmin") {
          return res.status(403).json({
            message: "Cannot modify superadmin accounts",
          });
        }

        // Build update object
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined && role !== "superadmin") {
          updateData.role = role;
        }

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, id))
          .returning();

        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  /**
   * GET /api/superadmin/stats
   * Get platform-wide statistics
   */
  app.get(
    "/api/superadmin/stats",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        // Total organizations
        const [{ totalOrgs }] = await db
          .select({ totalOrgs: count() })
          .from(organizations);

        // Active organizations
        const [{ activeOrgs }] = await db
          .select({ activeOrgs: count() })
          .from(organizations)
          .where(eq(organizations.isActive, true));

        // Organizations by status
        const orgsByStatus = await db
          .select({
            status: organizations.subscriptionStatus,
            count: count(),
          })
          .from(organizations)
          .groupBy(organizations.subscriptionStatus);

        // Total users (excluding superadmins)
        const [{ totalUsers }] = await db
          .select({ totalUsers: count() })
          .from(users)
          .where(sql`${users.role} != 'superadmin'`);

        // Users by role
        const usersByRole = await db
          .select({
            role: users.role,
            count: count(),
          })
          .from(users)
          .where(sql`${users.role} != 'superadmin'`)
          .groupBy(users.role);

        // Suspended users
        const [{ suspendedUsers }] = await db
          .select({ suspendedUsers: count() })
          .from(users)
          .where(eq(users.isSuspended, true));

        res.json({
          organizations: {
            total: totalOrgs || 0,
            active: activeOrgs || 0,
            byStatus: orgsByStatus,
          },
          users: {
            total: totalUsers || 0,
            suspended: suspendedUsers || 0,
            byRole: usersByRole,
          },
        });
      } catch (error) {
        console.error("Error fetching platform stats:", error);
        res.status(500).json({ message: "Failed to fetch statistics" });
      }
    }
  );
}
