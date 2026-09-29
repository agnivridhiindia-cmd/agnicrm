import { Response } from "express";
import { logger } from "../utils/logger";

export interface SseClient {
  id: string;
  userId: string;
  role: string;
  branchId?: string | null;
  res: Response;
}

export interface SseEvent {
  type: string;
  payload?: any;
  targetRoles?: string[];
  targetUserIds?: string[];
  targetBranchIds?: string[];
  timestamp?: string;
}

const sseClients = new Map<string, SseClient>();

// Global keep-alive heartbeat interval (25 seconds) to prevent proxy / browser timeout
let heartbeatTimer: NodeJS.Timeout | null = null;

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (sseClients.size === 0) return;
    const pingMessage = `: keep-alive ${Date.now()}\n\n`;
    for (const [clientId, client] of sseClients.entries()) {
      try {
        client.res.write(pingMessage);
      } catch (err) {
        logger.warn(`[SSE] Heartbeat failed for client ${clientId}, removing.`);
        removeSseClient(clientId);
      }
    }
  }, 25000);
  if (heartbeatTimer.unref) {
    heartbeatTimer.unref();
  }
}

/**
 * Registers an active SSE client stream
 */
export function addSseClient(client: SseClient) {
  // Set SSE streaming headers
  client.res.setHeader("Content-Type", "text/event-stream");
  client.res.setHeader("Cache-Control", "no-cache, no-transform");
  client.res.setHeader("Connection", "keep-alive");
  client.res.setHeader("X-Accel-Buffering", "no"); // Prevent NGINX buffering

  if (typeof (client.res as any).flushHeaders === "function") {
    (client.res as any).flushHeaders();
  }

  sseClients.set(client.id, client);
  ensureHeartbeat();

  // Send initial handshake confirmation
  const welcomePayload = JSON.stringify({
    type: "CONNECTED",
    clientId: client.id,
    message: "Real-time SSE event pipeline connected.",
    timestamp: new Date().toISOString(),
  });
  client.res.write(`data: ${welcomePayload}\n\n`);

  logger.info(`[SSE] Client connected: ${client.id} (user: ${client.userId}, role: ${client.role}). Total active: ${sseClients.size}`);
}

/**
 * Unregisters an active SSE client
 */
export function removeSseClient(clientId: string) {
  const client = sseClients.get(clientId);
  if (client) {
    try {
      if (!client.res.writableEnded) {
        client.res.end();
      }
    } catch (e) {
      // Ignored
    }
    sseClients.delete(clientId);
    logger.info(`[SSE] Client disconnected: ${clientId}. Total active: ${sseClients.size}`);
  }
}

/**
 * Broadcast an event to all or targeted SSE clients
 */
export function broadcastSseEvent(event: SseEvent) {
  const fullEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  const message = `data: ${JSON.stringify(fullEvent)}\n\n`;
  let sentCount = 0;

  for (const [clientId, client] of sseClients.entries()) {
    // Role filter
    if (event.targetRoles && event.targetRoles.length > 0 && !event.targetRoles.includes(client.role)) {
      continue;
    }

    // User filter
    if (event.targetUserIds && event.targetUserIds.length > 0 && !event.targetUserIds.includes(client.userId)) {
      continue;
    }

    // Branch filter
    if (event.targetBranchIds && event.targetBranchIds.length > 0) {
      // Admins and Owners always receive cross-branch events
      const isSuper = ["ADMIN", "OWNER"].includes(client.role);
      if (!isSuper && (!client.branchId || !event.targetBranchIds.includes(client.branchId))) {
        continue;
      }
    }

    try {
      client.res.write(message);
      sentCount++;
    } catch (err) {
      logger.warn(`[SSE] Broadcast write failed for client ${clientId}: ${String(err)}`);
      removeSseClient(clientId);
    }
  }

  logger.info(`[SSE] Broadcast ${event.type} sent to ${sentCount}/${sseClients.size} clients.`);
}

/**
 * Current count of connected SSE subscribers
 */
export function getSseSubscriberCount(): number {
  return sseClients.size;
}
