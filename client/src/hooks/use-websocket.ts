import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "./use-auth";

// WebSocket event types (matching server)
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

// Event handler type
type EventHandler = (data: any) => void;

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const eventHandlersRef = useRef<Map<WSEventType, Set<EventHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    if (!user) return;

    // Build WebSocket URL with query parameters
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = new URL(`${protocol}//${host}/ws`);
    url.searchParams.set("userId", user.id);
    url.searchParams.set("role", user.role);

    try {
      const ws = new WebSocket(url.toString());

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          // Get handlers for this event type
          const handlers = eventHandlersRef.current.get(message.type);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data));
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [user, reconnectAttempts]);

  // Subscribe to specific event
  const on = useCallback((eventType: WSEventType, handler: EventHandler) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  // Send message
  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, connect]);

  return {
    isConnected,
    on,
    send,
    reconnectAttempts,
  };
}
