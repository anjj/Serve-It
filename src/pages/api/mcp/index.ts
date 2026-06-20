import { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpSessions, createMCPServer } from "@/lib/mcp";
import { validateRawApiKey } from "@/lib/auth-api";

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
export function extractApiKey(req: NextApiRequest): string {
  const xApiKey = req.headers["x-api-key"] as string;
  if (xApiKey) return xApiKey;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers required for browser-based MCP clients (e.g. MCP Inspector) and ChatGPT
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, x-api-key, Content-Type, mcp-session-id, mcp-protocol-version");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- GET: Handle SSE Handshake (initialize) ---
  if (req.method === "GET") {
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return res.status(401).json({ error: "Unauthorized: Missing API Key" });
    }

    const auth = await validateRawApiKey(apiKey);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    // Set explicit headers to prevent buffering and keep the connection alive
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // The messages endpoint that clients should POST back to
    // Use a relative URL to support HTTPS tunnels (like ngrok) without mixed-content issues
    const messagesUrl = "/api/mcp/messages";

    const transport = new SSEServerTransport(messagesUrl, res as any);
    const server = createMCPServer(auth);

    await server.connect(transport);

    // Clean up session when transport closes
    transport.onclose = () => {
      mcpSessions.delete(transport.sessionId);
    };

    mcpSessions.set(transport.sessionId, transport);

    // Start the SSE stream, this handles initial SSE headers & sending the endpoint URL event
    await transport.start();

    // Prevent Next.js from closing the response early by holding the request open.
    // The SSEServerTransport keeps the response active.
    res.on("close", () => {
      transport.close();
    });

    return;
  }

  return res.status(405).json({ error: "Method not allowed" });
}
