import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

// Extend Express Request to include organization context
declare global {
  namespace Express {
    interface Request {
      organizationId?: string | null;
      isSuperadmin?: boolean;
    }
  }
}

/**
 * Tenant isolation middleware
 * Extracts organization context from authenticated user and adds it to request
 * Ensures all subsequent queries are scoped to the user's organization
 */
export function tenantIsolationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // User should be attached by auth middleware
  const user = req.user as User | undefined;

  if (!user) {
    // If no user, continue without organization context
    // Auth-protected routes will handle unauthenticated users
    return next();
  }

  // Superadmin has access to all organizations
  if (user.role === "superadmin") {
    req.isSuperadmin = true;
    req.organizationId = null; // Superadmin can access all orgs
  } else {
    req.isSuperadmin = false;
    req.organizationId = user.organizationId;
  }

  next();
}

/**
 * Subscription status check middleware
 * Ensures the organization has an active subscription
 * Blocks access for suspended/expired organizations
 */
export async function subscriptionCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip for superadmin
  if (req.isSuperadmin) {
    return next();
  }

  // Skip for public routes (login, register)
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }

  const user = req.user as User | undefined;
  if (!user || !user.organizationId) {
    return next();
  }

  try {
    const { db } = await import("./db");
    const { organizations } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    if (!org) {
      return res.status(403).json({
        message: "Organization not found",
      });
    }

    // Check if organization is active
    if (!org.isActive) {
      return res.status(403).json({
        message: "Your organization's account has been suspended. Please contact support.",
        suspendedReason: org.suspendedReason,
      });
    }

    // Check subscription status
    if (org.subscriptionStatus === "suspended" || org.subscriptionStatus === "cancelled") {
      return res.status(403).json({
        message: "Your organization's subscription is not active. Please contact your administrator.",
        subscriptionStatus: org.subscriptionStatus,
      });
    }

    // Check trial expiration
    if (org.subscriptionStatus === "trial" && org.trialEndsAt) {
      const now = new Date();
      if (now > org.trialEndsAt) {
        return res.status(403).json({
          message: "Your trial has expired. Please upgrade to continue using the service.",
          subscriptionStatus: "expired",
        });
      }
    }

    // Check subscription expiration
    if (org.subscriptionStatus === "active" && org.subscriptionEndsAt) {
      const now = new Date();
      if (now > org.subscriptionEndsAt) {
        return res.status(403).json({
          message: "Your subscription has expired. Please renew to continue.",
          subscriptionStatus: "expired",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    next(); // Continue on error to avoid blocking
  }
}

/**
 * Helper to get organization filter for queries
 * Returns the appropriate WHERE condition based on user role
 */
export function getOrganizationFilter(req: Request) {
  if (req.isSuperadmin) {
    return null; // No filter for superadmin
  }
  return req.organizationId;
}

/**
 * Helper to validate organization access
 * Ensures user can only access data from their organization
 */
export function validateOrganizationAccess(
  req: Request,
  targetOrganizationId: string
): boolean {
  // Superadmin can access any organization
  if (req.isSuperadmin) {
    return true;
  }

  // Regular users can only access their own organization
  return req.organizationId === targetOrganizationId;
}
