import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { insertStudentSchema, insertClassSchema, insertGateSchema, insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - creates /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Protected route example - requires authentication
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
  });

  // Role-based protected route example
  app.get("/api/admin/users", isAuthenticated, hasRole("admin"), async (req, res) => {
    res.json({ message: "Admin only route" });
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

      const updatedUser = await storage.updateUserNFCCard(req.user.id, nfcCardId);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Link NFC card to all existing children
      const children = await storage.getStudentsByParentId(req.user.id);
      for (const child of children) {
        await storage.updateStudent(child.id, { nfcCardId });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating NFC card:', error);
      res.status(500).json({ message: "Failed to update NFC card" });
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

      const validation = insertStudentSchema.safeParse({
        ...req.body,
        parentId: req.user.id,
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const student = await storage.createStudent(validation.data);
      
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
      const users = await storage.getUsersByRole("parent");
      const teachers = await storage.getUsersByRole("teacher");
      const security = await storage.getUsersByRole("security");
      const admins = await storage.getUsersByRole("admin");
      
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

      const user = await storage.createUser(validation.data);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
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
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/admin/classes", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const validation = insertClassSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      const classData = await storage.createClass(validation.data);
      res.status(201).json(classData);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.patch("/api/admin/classes/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
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
      const { id } = req.params;
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
      const gates = await storage.getAllGates();
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

      const gate = await storage.createGate(validation.data);
      res.status(201).json(gate);
    } catch (error) {
      console.error('Error creating gate:', error);
      res.status(500).json({ message: "Failed to create gate" });
    }
  });

  app.patch("/api/admin/gates/:id", isAuthenticated, hasRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
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
      const { id } = req.params;
      await storage.deleteGate(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting gate:', error);
      res.status(500).json({ message: "Failed to delete gate" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
