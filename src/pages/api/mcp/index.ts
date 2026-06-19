import { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpTransports, createMCPServer } from "@/lib/mcp";
import { validateRawApiKey } from "@/lib/auth-api";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers for MCP Inspector
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, x-api-key, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const transport = mcpTransports.get(sessionId);
    if (!transport) {
      return res.status(404).json({ error: "Session not found" });
    }

    await transport.handlePostMessage(req as any, res as any);
    return;
  }

  if (req.method === "GET") {
    const authHeader = req.headers.authorization;
    const xApiKey = req.headers["x-api-key"] as string;

    let apiKey = xApiKey || "";
    if (!apiKey && authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.split(" ")[1];
    }

    if (!apiKey) {
      return res.status(401).json({ error: "Unauthorized: Missing API Key" });
    }

    const auth = await validateRawApiKey(apiKey);
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    const sessionId = crypto.randomUUID();
    
    // We set the POST endpoint to the SAME file route, so they share the module instance memory!
    const transport = new SSEServerTransport(`/api/mcp?sessionId=${sessionId}`, res as any);
    
    mcpTransports.set(sessionId, transport);

    const server = createMCPServer(auth, transport);
    
    await server.connect(transport);

    // Prevent the Next.js API route from resolving and closing the response
    await new Promise((resolve) => {
      req.on("close", () => {
        mcpTransports.delete(sessionId);
        resolve(true);
      });
    });
    return;
  }

  return res.status(405).json({ error: "Method not allowed" });
}
