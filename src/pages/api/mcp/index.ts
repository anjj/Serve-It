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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, x-api-key, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
  
  // Create transport. The SDK will handle setting the Content-Type to text/event-stream
  const transport = new SSEServerTransport(`/api/mcp/message?sessionId=${sessionId}`, res as any);
  
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
}
