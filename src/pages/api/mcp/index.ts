import { NextApiRequest, NextApiResponse } from "next";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpSessions, createMCPServer } from "@/lib/mcp";
import { validateRawApiKey } from "@/lib/auth-api";
import crypto from "crypto";

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/**
 * Extracts the API key from Authorization header or x-api-key header.
 */
function extractApiKey(req: NextApiRequest): string {
  const xApiKey = req.headers["x-api-key"] as string;
  if (xApiKey) return xApiKey;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers required for browser-based MCP clients (e.g. MCP Inspector)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, x-api-key, Content-Type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- POST: Handle JSON-RPC messages (initialize + subsequent calls) ---
  if (req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Existing session: route the message to its transport
    if (sessionId && mcpSessions.has(sessionId)) {
      const transport = mcpSessions.get(sessionId)!;
      await transport.handleRequest(req as any, res as any, req.body);
      return;
    }

    // New session: authenticate first, then create transport + server
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return res.status(401).json({ error: "Unauthorized: Missing API Key" });
    }

    const auth = await validateRawApiKey(apiKey);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    // Clean up session when transport closes
    transport.onclose = () => {
      if (transport.sessionId) {
        mcpSessions.delete(transport.sessionId);
      }
    };

    const server = createMCPServer(auth);
    await server.connect(transport);

    // handleRequest processes the initialize message and sets transport.sessionId
    await transport.handleRequest(req as any, res as any, req.body);

    // Store the session after the initialize handshake completes
    if (transport.sessionId) {
      mcpSessions.set(transport.sessionId, transport);
    }

    return;
  }

  // --- GET: SSE stream for server-initiated notifications (optional) ---
  if (req.method === "GET") {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (!sessionId || !mcpSessions.has(sessionId)) {
      return res.status(404).json({ error: "Session not found" });
    }
    const transport = mcpSessions.get(sessionId)!;
    await transport.handleRequest(req as any, res as any);
    return;
  }

  // --- DELETE: Terminate a session ---
  if (req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (sessionId && mcpSessions.has(sessionId)) {
      const transport = mcpSessions.get(sessionId)!;
      await transport.close();
      mcpSessions.delete(sessionId);
    }
    return res.status(200).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
