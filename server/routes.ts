import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";
import { insertStudentSchema } from "@shared/schema";

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

      const updatedStudent = await storage.updateStudent(id, req.body);
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

  // Add more application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}
