import { db } from "./db";
import { auditLogs, type AuditAction } from "@shared/schema";
import type { Request } from "express";

interface LogAuditParams {
  userId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  targetName?: string;
  organizationId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Logger
 * Centralized logging for all important platform actions
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(params: LogAuditParams) {
    try {
      await db.insert(auditLogs).values({
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName,
        organizationId: params.organizationId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Log from Express request context
   * Automatically extracts IP and user agent
   */
  static async logFromRequest(
    req: Request,
    action: AuditAction,
    targetType: string,
    targetId?: string,
    targetName?: string,
    organizationId?: string | null,
    metadata?: Record<string, any>
  ) {
    if (!req.user) {
      console.warn("Attempted to log audit event without authenticated user");
      return;
    }

    await this.log({
      userId: req.user.id,
      action,
      targetType,
      targetId,
      targetName,
      organizationId,
      metadata,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("user-agent"),
    });
  }

  /**
   * Log organization created
   */
  static async logOrganizationCreated(
    req: Request,
    organizationId: string,
    organizationName: string,
    metadata?: Record<string, any>
  ) {
    await this.logFromRequest(
      req,
      "organization.created",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      metadata
    );
  }

  /**
   * Log organization updated
   */
  static async logOrganizationUpdated(
    req: Request,
    organizationId: string,
    organizationName: string,
    metadata?: Record<string, any>
  ) {
    await this.logFromRequest(
      req,
      "organization.updated",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      metadata
    );
  }

  /**
   * Log organization suspended
   */
  static async logOrganizationSuspended(
    req: Request,
    organizationId: string,
    organizationName: string,
    reason: string
  ) {
    await this.logFromRequest(
      req,
      "organization.suspended",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      { reason }
    );
  }

  /**
   * Log organization activated
   */
  static async logOrganizationActivated(
    req: Request,
    organizationId: string,
    organizationName: string
  ) {
    await this.logFromRequest(
      req,
      "organization.activated",
      "organization",
      organizationId,
      organizationName,
      organizationId
    );
  }

  /**
   * Log user suspended
   */
  static async logUserSuspended(
    req: Request,
    userId: string,
    userName: string,
    organizationId: string | null,
    reason: string
  ) {
    await this.logFromRequest(
      req,
      "user.suspended",
      "user",
      userId,
      userName,
      organizationId,
      { reason }
    );
  }

  /**
   * Log user unsuspended
   */
  static async logUserUnsuspended(
    req: Request,
    userId: string,
    userName: string,
    organizationId: string | null
  ) {
    await this.logFromRequest(
      req,
      "user.unsuspended",
      "user",
      userId,
      userName,
      organizationId
    );
  }

  /**
   * Log admin user created
   */
  static async logAdminCreated(
    req: Request,
    userId: string,
    userName: string,
    organizationName: string,
    organizationId: string
  ) {
    await this.logFromRequest(
      req,
      "admin.created",
      "user",
      userId,
      userName,
      organizationId,
      { organizationName }
    );
  }

  /**
   * Log subscription upgraded
   */
  static async logSubscriptionUpgraded(
    req: Request,
    organizationId: string,
    organizationName: string,
    planSlug: string,
    billingCycle: string
  ) {
    await this.logFromRequest(
      req,
      "subscription.upgraded",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      { planSlug, billingCycle }
    );
  }

  /**
   * Log subscription renewed
   */
  static async logSubscriptionRenewed(
    req: Request,
    organizationId: string,
    organizationName: string,
    billingCycle: string
  ) {
    await this.logFromRequest(
      req,
      "subscription.renewed",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      { billingCycle }
    );
  }

  /**
   * Log trial extended
   */
  static async logTrialExtended(
    req: Request,
    organizationId: string,
    organizationName: string,
    days: number
  ) {
    await this.logFromRequest(
      req,
      "trial.extended",
      "organization",
      organizationId,
      organizationName,
      organizationId,
      { days }
    );
  }
}
