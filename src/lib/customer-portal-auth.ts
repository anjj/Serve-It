import crypto from "crypto";

// The Customer Portal login (D3) is a deliberate second, independent grant
// path alongside the User/UserCustomer better-auth session: a workspace can
// be entered directly with its shared slug+password, with no corresponding
// User or UserCustomer row. It intentionally does NOT reuse better-auth's
// session table (which requires a real userId), so it is a small, separate,
// HMAC-signed cookie instead. See docs/domains/auth.md.
export const CUSTOMER_PORTAL_COOKIE = "customer_portal_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matching typical session lifetime

type CustomerPortalPayload = {
  customerId: string;
  slug: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured");
  return secret;
}

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function signCustomerPortalToken(customerId: string, slug: string): string {
  const payload: CustomerPortalPayload = {
    customerId,
    slug,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = crypto.createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64url(signature)}`;
}

export function verifyCustomerPortalToken(token: string | undefined | null): CustomerPortalPayload | null {
  if (!token) return null;
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  const expectedSignature = crypto.createHmac("sha256", getSecret()).update(payloadB64).digest();
  const actualSignature = Buffer.from(signatureB64, "base64url");
  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as CustomerPortalPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.customerId !== "string" || typeof payload.slug !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export const customerPortalCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
