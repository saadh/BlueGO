import { Request } from "express";
import { db } from "./db";
import { eq, and, SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

/**
 * Tenant-aware query helpers
 * Automatically scope queries to user's organization
 */

interface TableWithOrganization {
  organizationId: any;
}

/**
 * Build WHERE clause with organization filter
 * @param req Express request with organization context
 * @param table Database table
 * @param additionalConditions Additional WHERE conditions
 * @returns Combined WHERE clause with organization filter
 */
export function buildOrganizationWhere<T extends TableWithOrganization>(
  req: Request,
  table: T,
  additionalConditions?: SQL
): SQL | undefined {
  const orgFilter = req.isSuperadmin
    ? undefined
    : eq(table.organizationId, req.organizationId!);

  if (!orgFilter && !additionalConditions) {
    return undefined;
  }

  if (orgFilter && additionalConditions) {
    return and(orgFilter, additionalConditions);
  }

  return orgFilter || additionalConditions;
}

/**
 * Select query with automatic organization scoping
 * @param req Express request
 * @param table Database table
 * @param additionalWhere Additional WHERE conditions
 */
export async function selectWithTenant<T extends TableWithOrganization>(
  req: Request,
  table: T,
  additionalWhere?: SQL
) {
  const where = buildOrganizationWhere(req, table, additionalWhere);

  const query = db.select().from(table as any);

  if (where) {
    return query.where(where);
  }

  return query;
}

/**
 * Validate that a resource belongs to the user's organization
 * @param req Express request
 * @param table Database table
 * @param resourceId Resource ID to check
 * @returns true if access is allowed
 */
export async function validateResourceAccess<T extends TableWithOrganization>(
  req: Request,
  table: T,
  resourceId: string,
  idColumn: any
): Promise<boolean> {
  // Superadmin has access to everything
  if (req.isSuperadmin) {
    return true;
  }

  const where = and(
    eq(idColumn, resourceId),
    eq(table.organizationId, req.organizationId!)
  );

  const [resource] = await db
    .select()
    .from(table as any)
    .where(where)
    .limit(1);

  return !!resource;
}

/**
 * Insert with automatic organization assignment
 * @param req Express request
 * @param table Database table
 * @param values Values to insert
 */
export async function insertWithTenant<T extends TableWithOrganization>(
  req: Request,
  table: any,
  values: Partial<T>
) {
  // Ensure organizationId is set (unless superadmin is creating for specific org)
  const valuesWithOrg = {
    ...values,
    organizationId: values.organizationId || req.organizationId,
  };

  return db.insert(table).values(valuesWithOrg).returning();
}

/**
 * Update with organization validation
 * @param req Express request
 * @param table Database table
 * @param resourceId Resource ID to update
 * @param idColumn ID column reference
 * @param values Values to update
 */
export async function updateWithTenant<T extends TableWithOrganization>(
  req: Request,
  table: any,
  resourceId: string,
  idColumn: any,
  values: Partial<T>
) {
  const where = buildOrganizationWhere(
    req,
    table,
    eq(idColumn, resourceId)
  );

  if (!where) {
    // Superadmin without organization filter
    return db.update(table).set(values).where(eq(idColumn, resourceId)).returning();
  }

  return db.update(table).set(values).where(where).returning();
}

/**
 * Delete with organization validation
 * @param req Express request
 * @param table Database table
 * @param resourceId Resource ID to delete
 * @param idColumn ID column reference
 */
export async function deleteWithTenant<T extends TableWithOrganization>(
  req: Request,
  table: any,
  resourceId: string,
  idColumn: any
) {
  const where = buildOrganizationWhere(
    req,
    table,
    eq(idColumn, resourceId)
  );

  if (!where) {
    // Superadmin without organization filter
    return db.delete(table).where(eq(idColumn, resourceId)).returning();
  }

  return db.delete(table).where(where).returning();
}

/**
 * Check usage limits for an organization
 * @param organizationId Organization ID
 * @param resourceType Type of resource (students, staff, gates)
 * @param currentCount Current count of resources
 * @returns true if under limit
 */
export async function checkUsageLimit(
  organizationId: string,
  resourceType: "students" | "staff" | "gates",
  currentCount: number
): Promise<{ allowed: boolean; limit: string; message?: string }> {
  const { organizations } = await import("@shared/schema");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org) {
    return {
      allowed: false,
      limit: "0",
      message: "Organization not found",
    };
  }

  let limit: string;
  switch (resourceType) {
    case "students":
      limit = org.maxStudents || "100";
      break;
    case "staff":
      limit = org.maxStaff || "10";
      break;
    case "gates":
      // Gates limit would come from subscription plan
      limit = "10";
      break;
    default:
      limit = "0";
  }

  // Handle "unlimited" case
  if (limit === "unlimited") {
    return { allowed: true, limit };
  }

  const limitNumber = parseInt(limit, 10);
  const allowed = currentCount < limitNumber;

  return {
    allowed,
    limit,
    message: allowed
      ? undefined
      : `You have reached your ${resourceType} limit (${limit}). Please upgrade your plan.`,
  };
}
