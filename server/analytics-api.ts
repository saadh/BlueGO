import { Express } from "express";
import { db } from "./db";
import { organizations, users, students, dismissals, auditLogs, subscriptionPlans } from "@shared/schema";
import { eq, desc, and, or, gte, lte, count, sql } from "drizzle-orm";
import { isAuthenticated, hasRole } from "./auth";

/**
 * Analytics and Reporting APIs for superadmin
 * Provides comprehensive platform insights and revenue tracking
 */
export function setupAnalyticsRoutes(app: Express) {
  /**
   * GET /api/superadmin/analytics/overview
   * Platform-wide analytics overview
   */
  app.get(
    "/api/superadmin/analytics/overview",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { startDate, endDate } = req.query;

        // Build date filters
        const dateFilters = [];
        if (startDate) {
          dateFilters.push(gte(organizations.createdAt, new Date(startDate as string)));
        }
        if (endDate) {
          dateFilters.push(lte(organizations.createdAt, new Date(endDate as string)));
        }

        // Total organizations and growth
        const [{ totalOrgs }] = await db
          .select({ totalOrgs: count() })
          .from(organizations);

        const [{ activeOrgs }] = await db
          .select({ activeOrgs: count() })
          .from(organizations)
          .where(eq(organizations.isActive, true));

        // Organizations by plan
        const orgsByPlan = await db
          .select({
            plan: organizations.subscriptionPlan,
            count: count(),
          })
          .from(organizations)
          .groupBy(organizations.subscriptionPlan);

        // Organizations by status
        const orgsByStatus = await db
          .select({
            status: organizations.subscriptionStatus,
            count: count(),
          })
          .from(organizations)
          .groupBy(organizations.subscriptionStatus);

        // Total users across all organizations
        const [{ totalUsers }] = await db
          .select({ totalUsers: count() })
          .from(users)
          .where(sql`${users.role} != 'superadmin'`);

        // Total students
        const [{ totalStudents }] = await db
          .select({ totalStudents: count() })
          .from(students);

        // Total dismissals (activity metric)
        const [{ totalDismissals }] = await db
          .select({ totalDismissals: count() })
          .from(dismissals);

        // Recent organizations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [{ recentOrgs }] = await db
          .select({ recentOrgs: count() })
          .from(organizations)
          .where(gte(organizations.createdAt, thirtyDaysAgo));

        // Churn rate (suspended/cancelled in last 30 days)
        const [{ churnedOrgs }] = await db
          .select({ churnedOrgs: count() })
          .from(organizations)
          .where(
            and(
              or(
                eq(organizations.subscriptionStatus, "suspended"),
                eq(organizations.subscriptionStatus, "cancelled")
              ),
              gte(organizations.updatedAt, thirtyDaysAgo)
            )
          );

        res.json({
          organizations: {
            total: totalOrgs || 0,
            active: activeOrgs || 0,
            recent: recentOrgs || 0,
            churned: churnedOrgs || 0,
            byPlan: orgsByPlan,
            byStatus: orgsByStatus,
          },
          users: {
            total: totalUsers || 0,
          },
          students: {
            total: totalStudents || 0,
          },
          activity: {
            totalDismissals: totalDismissals || 0,
          },
        });
      } catch (error) {
        console.error("Error fetching analytics overview:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    }
  );

  /**
   * GET /api/superadmin/analytics/revenue
   * Revenue analytics and projections
   */
  app.get(
    "/api/superadmin/analytics/revenue",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        // Get all subscription plans for pricing
        const plans = await db.select().from(subscriptionPlans);
        const planPricing = new Map(
          plans.map((p) => [p.slug, { monthly: parseFloat(p.priceMonthly || "0"), yearly: parseFloat(p.priceYearly || "0") }])
        );

        // Get active organizations by plan
        const activeOrganizations = await db
          .select({
            id: organizations.id,
            plan: organizations.subscriptionPlan,
            status: organizations.subscriptionStatus,
            subscriptionEndsAt: organizations.subscriptionEndsAt,
          })
          .from(organizations)
          .where(
            and(
              eq(organizations.isActive, true),
              or(
                eq(organizations.subscriptionStatus, "active"),
                eq(organizations.subscriptionStatus, "trial")
              )
            )
          );

        // Calculate Monthly Recurring Revenue (MRR)
        let mrr = 0;
        let arr = 0; // Annual Recurring Revenue

        activeOrganizations.forEach((org) => {
          if (org.status === "active" && org.plan) {
            const pricing = planPricing.get(org.plan);
            if (pricing) {
              mrr += pricing.monthly;
              arr += pricing.yearly || pricing.monthly * 12;
            }
          }
        });

        // Trial to paid conversion (orgs that upgraded from trial)
        const [{ upgradedFromTrial }] = await db
          .select({ upgradedFromTrial: count() })
          .from(organizations)
          .where(
            and(
              eq(organizations.subscriptionStatus, "active"),
              sql`${organizations.subscription_plan} != 'trial'`
            )
          );

        // Organizations still on trial
        const [{ onTrial }] = await db
          .select({ onTrial: count() })
          .from(organizations)
          .where(eq(organizations.subscriptionStatus, "trial"));

        // Count organizations by plan for revenue calculation
        const orgsByPlanCount = await db
          .select({
            plan: organizations.subscriptionPlan,
            count: count(),
          })
          .from(organizations)
          .where(eq(organizations.subscriptionStatus, "active"))
          .groupBy(organizations.subscriptionPlan);

        // Revenue by plan
        const revenueByPlan = orgsByPlanCount.map((item) => {
            const pricing = planPricing.get(item.plan || "");
            return {
              plan: item.plan,
              count: item.count,
              monthlyRevenue: pricing ? pricing.monthly * item.count : 0,
              annualRevenue: pricing ? (pricing.yearly || pricing.monthly * 12) * item.count : 0,
            };
          });

        // Calculate average revenue per user (ARPU)
        const paidOrgs = activeOrganizations.filter((o) => o.status === "active" && o.plan !== "trial").length;
        const arpu = paidOrgs > 0 ? mrr / paidOrgs : 0;

        res.json({
          mrr: mrr.toFixed(2),
          arr: arr.toFixed(2),
          arpu: arpu.toFixed(2),
          paidOrganizations: paidOrgs,
          trialOrganizations: onTrial || 0,
          upgradedFromTrial: upgradedFromTrial || 0,
          conversionRate: onTrial ? ((upgradedFromTrial || 0) / ((upgradedFromTrial || 0) + (onTrial || 0)) * 100).toFixed(1) : "0.0",
          revenueByPlan,
        });
      } catch (error) {
        console.error("Error fetching revenue analytics:", error);
        res.status(500).json({ message: "Failed to fetch revenue analytics" });
      }
    }
  );

  /**
   * GET /api/superadmin/analytics/growth
   * Growth metrics over time
   */
  app.get(
    "/api/superadmin/analytics/growth",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { period = "30" } = req.query; // days
        const days = parseInt(period as string, 10);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Organizations created over time
        const orgsOverTime = await db
          .select({
            date: sql<string>`DATE(${organizations.createdAt})`,
            count: count(),
          })
          .from(organizations)
          .where(gte(organizations.createdAt, startDate))
          .groupBy(sql`DATE(${organizations.createdAt})`)
          .orderBy(sql`DATE(${organizations.createdAt})`);

        // Users created over time
        const usersOverTime = await db
          .select({
            date: sql<string>`DATE(${users.createdAt})`,
            count: count(),
          })
          .from(users)
          .where(
            and(
              gte(users.createdAt, startDate),
              sql`${users.role} != 'superadmin'`
            )
          )
          .groupBy(sql`DATE(${users.createdAt})`)
          .orderBy(sql`DATE(${users.createdAt})`);

        res.json({
          organizations: orgsOverTime,
          users: usersOverTime,
        });
      } catch (error) {
        console.error("Error fetching growth metrics:", error);
        res.status(500).json({ message: "Failed to fetch growth metrics" });
      }
    }
  );

  /**
   * GET /api/superadmin/analytics/audit-logs
   * Recent audit log entries
   */
  app.get(
    "/api/superadmin/analytics/audit-logs",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { page = "1", limit = "50", action = "", targetType = "" } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        // Build filters
        const filters = [];
        if (action) {
          filters.push(eq(auditLogs.action, action as any));
        }
        if (targetType) {
          filters.push(eq(auditLogs.targetType, targetType as string));
        }

        // Get total count
        const [{ total }] = await db
          .select({ total: count() })
          .from(auditLogs)
          .where(filters.length > 0 ? and(...filters) : undefined);

        // Get audit logs with user info
        const logs = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            targetType: auditLogs.targetType,
            targetId: auditLogs.targetId,
            targetName: auditLogs.targetName,
            organizationId: auditLogs.organizationId,
            metadata: auditLogs.metadata,
            ipAddress: auditLogs.ipAddress,
            createdAt: auditLogs.createdAt,
            userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
            userEmail: users.email,
          })
          .from(auditLogs)
          .leftJoin(users, eq(auditLogs.userId, users.id))
          .where(filters.length > 0 ? and(...filters) : undefined)
          .orderBy(desc(auditLogs.createdAt))
          .limit(limitNum)
          .offset(offset);

        res.json({
          logs,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: total || 0,
            totalPages: Math.ceil((total || 0) / limitNum),
          },
        });
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  /**
   * GET /api/superadmin/analytics/activity
   * Platform activity metrics
   */
  app.get(
    "/api/superadmin/analytics/activity",
    isAuthenticated,
    hasRole("superadmin"),
    async (req, res) => {
      try {
        const { period = "7" } = req.query; // days
        const days = parseInt(period as string, 10);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Dismissals per day
        const dismissalsPerDay = await db
          .select({
            date: sql<string>`DATE(${dismissals.scannedAt})`,
            count: count(),
          })
          .from(dismissals)
          .where(gte(dismissals.scannedAt, startDate))
          .groupBy(sql`DATE(${dismissals.scannedAt})`)
          .orderBy(sql`DATE(${dismissals.scannedAt})`);

        // Most active organizations (by dismissal count)
        const activeOrgs = await db
          .select({
            organizationId: dismissals.organizationId,
            organizationName: organizations.name,
            dismissalCount: count(),
          })
          .from(dismissals)
          .leftJoin(organizations, eq(dismissals.organizationId, organizations.id))
          .where(gte(dismissals.scannedAt, startDate))
          .groupBy(dismissals.organizationId, organizations.name)
          .orderBy(desc(count()))
          .limit(10);

        res.json({
          dismissalsPerDay,
          topOrganizations: activeOrgs,
        });
      } catch (error) {
        console.error("Error fetching activity metrics:", error);
        res.status(500).json({ message: "Failed to fetch activity metrics" });
      }
    }
  );
}
