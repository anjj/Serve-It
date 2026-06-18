export async function logSecurityEvent(event: {
  actorId: string;
  action: string;
  resource: string;
  tenantId?: string;
  ipAddress?: string;
  status: "SUCCESS" | "FAILURE";
  details?: string;
}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...event,
  };

  // In this implementation, we log to console (stdout/stderr) which is typically
  // captured by cloud logging solutions (CloudWatch, Vercel Logs, etc.)
  // AC 4: Security Logging & Alerting
  console.warn(`[SECURITY EVENT] ${JSON.stringify(logEntry)}`);
}
