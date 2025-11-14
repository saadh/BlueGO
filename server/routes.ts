import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole, hashPassword } from "./auth";
import { insertStudentSchema, insertClassSchema, insertGateSchema, insertUserSchema } from "@shared/schema";
import { wsManager } from "./websocket";
import { tenantIsolationMiddleware, subscriptionCheckMiddleware } from "./tenant-middleware";
import { setupOrganizationRoutes } from "./organizations-api";
import { setupUserManagementRoutes } from "./users-api";
import { setupAnalyticsRoutes } from "./analytics-api";
import { checkUsageLimit } from "./tenant-queries";

// Helper function to normalize NFC card ID format
function normalizeNFCCardId(nfcCardId: string): string {
  // Remove colons and convert to uppercase for consistent storage/lookup
  return nfcCardId.replace(/:/g, '').toUpperCase();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - creates /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Apply tenant isolation middleware to all API routes
  // This extracts organization context from authenticated user
  app.use("/api", tenantIsolationMiddleware);

  // Apply subscription check middleware to all API routes (except auth)
  // This ensures organizations have active subscriptions
  app.use("/api", subscriptionCheckMiddleware);

  // Protected route example - requires authentication
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
  });

  // Update parent NFC card - parent only route
  app.post("/api/parent/nfc-card", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      const { nfcCardId } = req.body;
      
      if (!nfcCardId || typeof nfcCardId !== 'string') {
        return res.status(400).json({ message: "NFC card ID is required" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Normalize NFC card ID (remove colons, uppercase) before storing
      const normalizedNfcCardId = normalizeNFCCardId(nfcCardId);

      const updatedUser = await storage.updateUserNFCCard(req.user.id, normalizedNfcCardId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Link NFC card to all existing children
      const children = await storage.getStudentsByParentId(req.user.id);
      for (const child of children) {
        await storage.updateStudent(child.id, { nfcCardId: normalizedNfcCardId });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating NFC card:', error);
      res.status(500).json({ message: "Failed to update NFC card" });
    }
  });

  // Get all gates - available to security personnel
  app.get("/api/gates", isAuthenticated, hasRole("security"), async (req, res) => {
    try {
      const gates = await storage.getAllGates();
      res.json(gates);
    } catch (error) {
      console.error('Error fetching gates:', error);
      res.status(500).json({ message: "Failed to fetch gates" });
    }
  });

  // Security NFC scan - creates dismissal records for all children of scanned parent
  app.post("/api/security/scan", isAuthenticated, hasRole("security"), async (req, res) => {
    try {
      const { nfcCardId, gateId } = req.body;
      
      if (!nfcCardId || typeof nfcCardId !== 'string') {
        return res.status(400).json({ message: "NFC card ID is required" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Normalize NFC card ID (remove colons, uppercase) before lookup
      const normalizedNfcCardId = normalizeNFCCardId(nfcCardId);
      
      // Look up parent by NFC card
      const parent = await storage.getUserByNFCCard(normalizedNfcCardId);
      if (!parent) {
        return res.status(404).json({ message: "No parent found with this NFC card" });
      }

      // Get all children for this parent
      const children = await storage.getStudentsByParentId(parent.id);
      if (children.length === 0) {
        return res.status(404).json({ message: "No students found for this parent" });
      }

      // Create dismissal for each child
      const dismissals = [];
      for (const child of children) {
        const dismissal = await storage.createDismissal({
          studentId: child.id,
          parentId: parent.id,
          gateId: gateId || null,
          scannedByUserId: req.user.id,
          status: "called", // Set to called to trigger classroom display
          calledAt: new Date(),
        });
        dismissals.push(dismissal);

        // Notify via WebSocket about new dismissal
        const gate = await storage.getGateById(gateId);
        wsManager.notifyDismissalCreated({
          id: dismissal.id,
          studentId: child.id,
          studentName: child.name,
          studentAvatarUrl: child.avatarUrl,
          studentGrade: child.grade,
          studentClass: child.class,
          parentId: parent.id,
          parentFirstName: parent.firstName,
          parentLastName: parent.lastName,
          gateName: gate?.name || "Unknown",
          status: dismissal.status,
          calledAt: dismissal.calledAt,
        });
      }

      res.status(201).json({
        message: `Created ${dismissals.length} dismissal(s)`,
        parent: { id: parent.id, name: `${parent.firstName} ${parent.lastName}` },
        dismissals: dismissals.length,
      });
    } catch (error) {
      console.error('Error processing NFC scan:', error);
      res.status(500).json({ message: "Failed to process scan" });
    }
  });

  // Teacher routes - classroom display dismissals
  
  // Get teacher's assigned classes or all classes for admin
  app.get("/api/teacher/classes", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Admins see all classes in their organization
      if (req.user.role === "admin") {
        if (!req.user.organizationId) {
          return res.status(400).json({ message: "Admin must belong to an organization" });
        }
        const classes = await storage.getClassesByOrganization(req.user.organizationId);
        res.json(classes);
        return;
      }

      // Teachers see only their assigned classes
      if (req.user.role === "teacher") {
        const classes = await storage.getTeacherClassAssignments(req.user.id);
        res.json(classes);
        return;
      }

      res.status(403).json({ message: "Unauthorized role" });
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get all dismissals for teacher's assigned classes or all dismissals for admin
  app.get("/api/teacher/dismissals", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Admins see all dismissals in their organization
      if (req.user.role === "admin") {
        if (!req.user.organizationId) {
          return res.status(400).json({ message: "Admin must belong to an organization" });
        }
        const dismissals = await storage.getDismissalsForOrganization(req.user.organizationId);
        res.json(dismissals);
        return;
      }

      // Teachers see only dismissals for their assigned classes
      if (req.user.role === "teacher") {
        const dismissals = await storage.getDismissalsForTeacherClasses(req.user.id);
        res.json(dismissals);
        return;
      }

      res.status(403).json({ message: "Unauthorized role" });
    } catch (error) {
      console.error('Error fetching dismissals:', error);
      res.status(500).json({ message: "Failed to fetch dismissals" });
    }
  });

  // Public classes endpoint - accessible to authenticated users for form dropdowns
  // Returns classes filtered by the user's organization
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const classes = await storage.getClassesByOrganization(req.user.organizationId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Parent routes

  // Get organizations where parent is registered (by email or phone)
  app.get("/api/parent/organizations", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Find all user records with the same email or phone across different organizations
      let parentAccounts: User[] = [];

      if (req.user.email) {
        parentAccounts = await storage.getUsersByEmail(req.user.email);
      } else if (req.user.phone) {
        parentAccounts = await storage.getUsersByPhone(req.user.phone);
      } else {
        return res.status(400).json({ message: "User must have email or phone" });
      }

      // Extract unique organization IDs
      const orgIds = [...new Set(parentAccounts.map(acc => acc.organizationId).filter(id => id))];

      // Fetch organization details for each
      const organizations = await Promise.all(
        orgIds.map(async (orgId) => {
          const org = await storage.getOrganizationById(orgId!);
          return org;
        })
      );

      // Filter out any null/undefined and return
      const validOrgs = organizations.filter(org => org !== undefined);

      res.json(validOrgs);
    } catch (error) {
      console.error('Error fetching parent organizations:', error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Get classes for a specific organization (for parent adding student)
  app.get("/api/parent/classes/:organizationId", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { organizationId } = req.params;

      // Verify parent has access to this organization (is registered there)
      let parentAccount: User | undefined;
      if (req.user.email) {
        parentAccount = await storage.getUserByEmailAndOrganization(req.user.email, organizationId);
      } else if (req.user.phone) {
        parentAccount = await storage.getUserByPhoneAndOrganization(req.user.phone, organizationId);
      }

      if (!parentAccount) {
        return res.status(403).json({ message: "You are not registered in this organization" });
      }

      const classes = await storage.getClassesByOrganization(organizationId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching organization classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Student management routes - parent only

  // Get all students for the authenticated parent
  app.get("/api/students", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const studentList = await storage.getStudentsByParentId(req.user.id);
      res.json(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Add a new student
  app.post("/api/students", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({ message: "Organization (school) selection is required" });
      }

      // Verify parent has access to this organization (is registered there)
      let parentAccount: User | undefined;
      if (req.user.email) {
        parentAccount = await storage.getUserByEmailAndOrganization(req.user.email, organizationId);
      } else if (req.user.phone) {
        parentAccount = await storage.getUserByPhoneAndOrganization(req.user.phone, organizationId);
      }

      if (!parentAccount) {
        return res.status(403).json({ message: "You are not registered in the selected school" });
      }

      // Fetch organization to get the name for the school field
      const organization = await storage.getOrganizationById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Prepare data for validation: remove organizationId (omitted in schema) and add school
      const { organizationId: _, ...bodyWithoutOrgId } = req.body;
      const validation = insertStudentSchema.safeParse({
        ...bodyWithoutOrgId,
        parentId: req.user.id,
        school: organization.name, // Add school for validation
      });

      if (!validation.success) {
        console.error('Student validation failed:', validation.error.errors);
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      // Check usage limits for student creation
      const currentStudents = await storage.getStudentsByOrganization(organizationId);
      const limitCheck = await checkUsageLimit(
        organizationId,
        "students",
        currentStudents.length
      );

      if (!limitCheck.allowed) {
        return res.status(403).json({
          message: limitCheck.message,
          currentCount: currentStudents.length,
          limit: limitCheck.limit,
        });
      }

      // Add organizationId (school is already included from validation)
      const studentData = {
        ...validation.data,
        organizationId: organizationId,
      };

      const student = await storage.createStudent(studentData);
      
      // If parent has NFC card, automatically link it to the new student
      if (req.user.nfcCardId) {
        await storage.updateStudent(student.id, { nfcCardId: req.user.nfcCardId });
      }

      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Update a student
  app.patch("/api/students/:id", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      
      // Verify the student belongs to the authenticated parent
      const existingStudent = await storage.getStudentById(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (existingStudent.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate and whitelist allowed fields (prevent parentId reassignment)
      const updateSchema = insertStudentSchema.partial().omit({ parentId: true });
      const validation = updateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const updatedStudent = await storage.updateStudent(id, validation.data);
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Update student avatar specifically
  app.patch("/api/students/:id/avatar", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;
      const { avatarUrl } = req.body;

      if (!avatarUrl || typeof avatarUrl !== 'string') {
        return res.status(400).json({ message: "Avatar URL is required" });
      }

      // Verify the student belongs to the authenticated parent
      const existingStudent = await storage.getStudentById(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (existingStudent.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedStudent = await storage.updateStudent(id, { avatarUrl });
      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student avatar:', error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Request pick-up for a student (parent-initiated, no NFC card needed)
  app.post("/api/parent/request-pickup", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { studentId } = req.body;

      if (!studentId || typeof studentId !== 'string') {
        return res.status(400).json({ message: "Student ID is required" });
      }

      // Verify the student belongs to the authenticated parent
      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.parentId !== req.user.id) {
        return res.status(403).json({ message: "You can only request pick-up for your own children" });
      }

      // Create dismissal request (similar to NFC scan but without gate/security info)
      const dismissal = await storage.createDismissal({
        studentId: student.id,
        parentId: req.user.id,
        organizationId: req.user.organizationId!,
        gateId: null, // Parent is requesting from app, not at a gate
        scannedByUserId: null, // No security staff involved
        status: "called", // Set to called to trigger classroom display immediately
        calledAt: new Date(),
      });

      // Notify via WebSocket about new dismissal (same as NFC scan)
      wsManager.notifyDismissalCreated({
        id: dismissal.id,
        studentId: student.id,
        studentName: student.name,
        studentAvatarUrl: student.avatarUrl,
        studentGrade: student.grade,
        studentClass: student.class,
        parentId: req.user.id,
        parentFirstName: req.user.firstName,
        parentLastName: req.user.lastName,
        gateName: "App Request", // Indicate this was requested via app
        status: dismissal.status,
        calledAt: dismissal.calledAt,
      });

      res.status(201).json({
        message: "Pick-up request created successfully",
        dismissal: {
          id: dismissal.id,
          studentId: student.id,
          studentName: student.name,
          status: dismissal.status,
        },
      });
    } catch (error) {
      console.error('Error creating pick-up request:', error);
      res.status(500).json({ message: "Failed to create pick-up request" });
    }
  });

  // Delete a student
  app.delete("/api/students/:id", isAuthenticated, hasRole("parent"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      // Verify the student belongs to the authenticated parent
      const existingStudent = await storage.getStudentById(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (existingStudent.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteStudent(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Admin routes - require admin role
  
  // User Management
  app.get("/api/admin/users", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      // Fetch only users from the admin's organization (multi-tenant isolation)
      const users = await storage.getUsersByRoleAndOrganization("parent", req.user.organizationId);
      const teachers = await storage.getUsersByRoleAndOrganization("teacher", req.user.organizationId);
      const security = await storage.getUsersByRoleAndOrganization("security", req.user.organizationId);
      const admins = await storage.getUsersByRoleAndOrganization("admin", req.user.organizationId);

      const allUsers = [...users, ...teachers, ...security, ...admins].map(({ password: _, ...user }) => user);
      res.json(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      // For parents: check if user with this email or phone already exists
      if (validation.data.role === "parent") {
        let existingUsers: User[] = [];

        if (validation.data.email) {
          existingUsers = await storage.getUsersByEmail(validation.data.email);
        } else if (validation.data.phone) {
          existingUsers = await storage.getUsersByPhone(validation.data.phone);
        }

        if (existingUsers.length > 0) {
          // Check if any existing user is not a parent
          const nonParentUser = existingUsers.find(u => u.role !== "parent");
          if (nonParentUser) {
            const identifier = validation.data.email ? "email" : "phone";
            return res.status(400).json({
              message: `This ${identifier} is already registered as a ${nonParentUser.role}. Cannot add as parent.`
            });
          }

          // Check if parent already linked to this organization
          const alreadyLinked = existingUsers.find(u => u.organizationId === req.user!.organizationId);
          if (alreadyLinked) {
            return res.status(400).json({
              message: "This parent is already registered in your school"
            });
          }

          // Parent exists in other schools - link to this organization
          // Use the same password as existing parent account
          const existingParent = existingUsers[0];
          const user = await storage.createUser({
            ...validation.data,
            password: existingParent.password, // Reuse existing password
            organizationId: req.user.organizationId,
          });

          const { password: _, ...userWithoutPassword } = user;
          return res.status(201).json({
            ...userWithoutPassword,
            message: "Existing parent linked to your school"
          });
        }
      }

      // Check usage limits for staff creation (teacher, security, admin roles only)
      const staffRoles = ["teacher", "security", "admin"];
      if (staffRoles.includes(validation.data.role)) {
        const currentStaff = await storage.getStaffByOrganization(req.user.organizationId);
        const limitCheck = await checkUsageLimit(
          req.user.organizationId,
          "staff",
          currentStaff.length
        );

        if (!limitCheck.allowed) {
          return res.status(403).json({
            message: limitCheck.message,
            currentCount: currentStaff.length,
            limit: limitCheck.limit,
          });
        }
      }

      // Hash the password before storing (for new users)
      const hashedPassword = await hashPassword(validation.data.password);
      const user = await storage.createUser({
        ...validation.data,
        password: hashedPassword,
        organizationId: req.user.organizationId,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { id } = req.params;

      // Verify user belongs to admin's organization
      const userToDelete = await storage.getUser(id);
      if (!userToDelete || userToDelete.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this user" });
      }

      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Class Management
  app.get("/api/admin/classes", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const classes = await storage.getClassesWithTeachersByOrganization(req.user.organizationId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/admin/classes", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      // Fetch organization to get the name for the school field
      const organization = await storage.getOrganizationById(req.user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const validation = insertClassSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      // Add organizationId and school name from authenticated user's organization
      const classDataWithOrg = {
        ...validation.data,
        organizationId: req.user.organizationId,
        school: organization.name, // Auto-populate school from organization name
      };

      const classData = await storage.createClass(classDataWithOrg);
      res.status(201).json(classData);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.patch("/api/admin/classes/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { id } = req.params;

      // Verify class belongs to admin's organization
      const classInfo = await storage.getClass(id);
      if (!classInfo || classInfo.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this class" });
      }

      const validation = insertClassSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      const updatedClass = await storage.updateClass(id, validation.data);
      res.json(updatedClass);
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/admin/classes/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { id } = req.params;

      // Verify class belongs to admin's organization
      const classInfo = await storage.getClass(id);
      if (!classInfo || classInfo.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this class" });
      }

      await storage.deleteClass(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Gate Management
  app.get("/api/admin/gates", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const gates = await storage.getGatesByOrganization(req.user.organizationId);
      res.json(gates);
    } catch (error) {
      console.error('Error fetching gates:', error);
      res.status(500).json({ message: "Failed to fetch gates" });
    }
  });

  app.post("/api/admin/gates", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const validation = insertGateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      // Check usage limits for gate creation
      if (req.user?.organizationId) {
        const currentGates = await storage.getGatesByOrganization(req.user.organizationId);
        const limitCheck = await checkUsageLimit(
          req.user.organizationId,
          "gates",
          currentGates.length
        );

        if (!limitCheck.allowed) {
          return res.status(403).json({
            message: limitCheck.message,
            currentCount: currentGates.length,
            limit: limitCheck.limit,
          });
        }
      }

      // Add organizationId from authenticated user
      const gateData = {
        ...validation.data,
        organizationId: req.user!.organizationId!,
      };

      const gate = await storage.createGate(gateData);
      res.status(201).json(gate);
    } catch (error) {
      console.error('Error creating gate:', error);
      res.status(500).json({ message: "Failed to create gate" });
    }
  });

  app.patch("/api/admin/gates/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { id } = req.params;

      // Verify gate belongs to admin's organization
      const gate = await storage.getGate(id);
      if (!gate || gate.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this gate" });
      }

      const validation = insertGateSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors
        });
      }

      const updatedGate = await storage.updateGate(id, validation.data);
      res.json(updatedGate);
    } catch (error) {
      console.error('Error updating gate:', error);
      res.status(500).json({ message: "Failed to update gate" });
    }
  });

  app.delete("/api/admin/gates/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { id } = req.params;

      // Verify gate belongs to admin's organization
      const gate = await storage.getGate(id);
      if (!gate || gate.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this gate" });
      }

      await storage.deleteGate(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting gate:', error);
      res.status(500).json({ message: "Failed to delete gate" });
    }
  });

  // Teacher-Class Assignment Management
  app.get("/api/admin/teacher-classes/:teacherId", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { teacherId } = req.params;

      // Verify teacher belongs to admin's organization
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this teacher" });
      }

      const classes = await storage.getTeacherClassAssignments(teacherId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      res.status(500).json({ message: "Failed to fetch teacher classes" });
    }
  });

  app.post("/api/admin/teacher-classes", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { teacherId, classId } = req.body;

      if (!teacherId || !classId) {
        return res.status(400).json({ message: "Teacher ID and Class ID are required" });
      }

      // Verify teacher belongs to admin's organization
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this teacher" });
      }

      // Verify class belongs to admin's organization
      const classInfo = await storage.getClass(classId);
      if (!classInfo || classInfo.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this class" });
      }

      const assignment = await storage.createTeacherClassAssignment({ teacherId, classId });
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('Error creating teacher-class assignment:', error);
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ message: "This teacher is already assigned to this class" });
      }
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.delete("/api/admin/teacher-classes/:teacherId/:classId", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({ message: "Admin must belong to an organization" });
      }

      const { teacherId, classId } = req.params;

      // Verify teacher belongs to admin's organization
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this teacher" });
      }

      // Verify class belongs to admin's organization
      const classInfo = await storage.getClass(classId);
      if (!classInfo || classInfo.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied to this class" });
      }

      await storage.deleteTeacherClassAssignment(teacherId, classId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting teacher-class assignment:', error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Fix student classIds - admin utility endpoint
  app.post("/api/admin/fix-student-classes", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const result = await storage.fixStudentClassIds();
      res.json({
        message: `Updated ${result.updated} students, ${result.failed} students have no matching class`,
        ...result
      });
    } catch (error) {
      console.error('Error fixing student classIds:', error);
      res.status(500).json({ message: "Failed to fix student classIds" });
    }
  });

  // Statistics endpoints - accessible to teachers and admins
  app.get("/api/stats/dismissals", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await storage.getDismissalStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dismissal statistics:', error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/stats/gates", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await storage.getGateStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      console.error('Error fetching gate statistics:', error);
      res.status(500).json({ message: "Failed to fetch gate statistics" });
    }
  });

  app.get("/api/stats/hourly", isAuthenticated, async (req, res) => {
    try {
      const { date } = req.query;

      const stats = await storage.getDismissalsByHour(
        date ? new Date(date as string) : undefined
      );

      res.json(stats);
    } catch (error) {
      console.error('Error fetching hourly statistics:', error);
      res.status(500).json({ message: "Failed to fetch hourly statistics" });
    }
  });

  // Setup organization management routes for superadmin
  setupOrganizationRoutes(app);

  // Setup user management routes for superadmin
  setupUserManagementRoutes(app);

  // Setup analytics and reporting routes for superadmin
  setupAnalyticsRoutes(app);

  // Get all subscription plans (accessible to superadmin for creating/editing organizations)
  app.get("/api/subscription-plans", isAuthenticated, hasRole("superadmin"), async (req, res) => {
    try {
      const { db } = await import("./db");
      const { subscriptionPlans } = await import("@shared/schema");
      const { asc } = await import("drizzle-orm");

      const plans = await db
        .select()
        .from(subscriptionPlans)
        .orderBy(asc(subscriptionPlans.priceMonthly));

      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket server
  wsManager.initialize(httpServer);

  return httpServer;
}
