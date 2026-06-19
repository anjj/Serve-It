import { NextApiRequest, NextApiResponse } from "next";
import { mcpTransports } from "@/lib/mcp";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = req.query.sessionId as string;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const transport = mcpTransports.get(sessionId);
  if (!transport) {
    return res.status(404).json({ error: "Session not found" });
  }

  // SSEServerTransport has a handlePostMessage method
  await transport.handlePostMessage(req as any, res as any);
}
