import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import type { Server } from "http";

// WebSocket event types
export enum WSEventType {
  DISMISSAL_CREATED = "dismissal:created",
  DISMISSAL_UPDATED = "dismissal:updated",
  DISMISSAL_COMPLETED = "dismissal:completed",
  CONNECTION_SUCCESS = "connection:success",
  HEARTBEAT = "heartbeat",
}

// WebSocket message structure
export interface WSMessage {
  type: WSEventType;
  data: any;
  timestamp: number;
}

// Client connection with metadata
interface WSClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  teacherId?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WSClient> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    this.wss.on("connection", this.handleConnection.bind(this));

    // Start heartbeat to detect dead connections
    this.startHeartbeat();

    console.log("WebSocket server initialized on /ws");
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const client: WSClient = {
      ws,
      isAlive: true,
    };

    this.clients.add(client);

    // Parse query parameters for user identification
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    const teacherId = url.searchParams.get("teacherId");

    if (userId) client.userId = userId;
    if (role) client.role = role;
    if (teacherId) client.teacherId = teacherId;

    console.log(`WebSocket client connected: ${userId || 'anonymous'} (${role || 'unknown role'})`);

    // Send connection success message
    this.sendToClient(client, {
      type: WSEventType.CONNECTION_SUCCESS,
      data: { message: "Connected to BlueGO WebSocket server" },
      timestamp: Date.now(),
    });

    // Handle pong responses for heartbeat
    ws.on("pong", () => {
      client.isAlive = true;
    });

    // Handle incoming messages
    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log(`WebSocket client disconnected: ${userId || 'anonymous'}`);
      this.clients.delete(client);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.clients.delete(client);
    });
  }

  private handleMessage(client: WSClient, message: any) {
    // Handle specific message types if needed
    if (message.type === WSEventType.HEARTBEAT) {
      client.isAlive = true;
    }
  }

  private sendToClient(client: WSClient, message: WSMessage) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Broadcast to all connected clients
  broadcast(message: WSMessage) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  // Broadcast to specific role (e.g., all teachers)
  broadcastToRole(role: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.role === role) {
        this.sendToClient(client, message);
      }
    });
  }

  // Broadcast to specific teacher
  broadcastToTeacher(teacherId: string, message: WSMessage) {
    this.clients.forEach((client) => {
      if (client.teacherId === teacherId) {
        this.sendToClient(client, message);
      }
    });
  }

  // Notify about new dismissal
  notifyDismissalCreated(dismissalData: any) {
    const message: WSMessage = {
      type: WSEventType.DISMISSAL_CREATED,
      data: dismissalData,
      timestamp: Date.now(),
    };

    // Broadcast to all teachers
    this.broadcastToRole("teacher", message);
  }

  // Notify about dismissal update
  notifyDismissalUpdated(dismissalData: any) {
    const message: WSMessage = {
      type: WSEventType.DISMISSAL_UPDATED,
      data: dismissalData,
      timestamp: Date.now(),
    };

    // Broadcast to all teachers
    this.broadcastToRole("teacher", message);
  }

  // Notify about dismissal completion
  notifyDismissalCompleted(dismissalData: any) {
    const message: WSMessage = {
      type: WSEventType.DISMISSAL_COMPLETED,
      data: dismissalData,
      timestamp: Date.now(),
    };

    // Broadcast to all teachers and security
    this.broadcastToRole("teacher", message);
    this.broadcastToRole("security", message);
  }

  // Heartbeat to detect dead connections
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          console.log("Terminating dead WebSocket connection");
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // Check every 30 seconds
  }

  // Clean up on server shutdown
  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    if (this.wss) {
      this.wss.close();
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
