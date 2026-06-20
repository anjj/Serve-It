import { NextApiRequest, NextApiResponse } from "next";
import { mcpSessions } from "@/lib/mcp";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, x-api-key, Content-Type, mcp-session-id, mcp-protocol-version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    // The SSEServerTransport normally encodes the sessionId in the query string
    // when it generated the endpoint URL (e.g. ?sessionId=...)
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId in query parameters" });
    }

    if (!mcpSessions.has(sessionId)) {
      return res.status(404).json({ error: "Session not found" });
    }

    const transport = mcpSessions.get(sessionId)!;

    // Passing the HTTP Request and Response so the transport can read the POST body
    // The transport handles parsing the JSON-RPC payload and mapping it to the connection.
    try {
      await transport.handlePostMessage(req as any, res as any, req.body);
      return; // handlePostMessage will write to the res
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
