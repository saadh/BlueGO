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

  // Add more application routes here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}
