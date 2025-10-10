import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hasRole } from "./auth";

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

      // TODO: Link NFC card to all children
      // This will be implemented when we have the students/children schema

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating NFC card:', error);
      res.status(500).json({ message: "Failed to update NFC card" });
    }
  });

  // Add more application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}
