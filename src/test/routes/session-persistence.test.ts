import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.BETTER_AUTH_SECRET = "test-secret-key-12345678901234567890";

// Mock auth.api.getSession
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock customer-portal-auth to avoid cross-test module contamination
vi.mock("@/lib/customer-portal-auth", () => ({
  CUSTOMER_PORTAL_COOKIE: "customer_portal_session",
  verifyCustomerPortalToken: vi.fn(),
  signCustomerPortalToken: vi.fn(),
  customerPortalSetCookieHeader: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { resolveActor } from "@/lib/auth-utils";
import { verifyCustomerPortalToken } from "@/lib/customer-portal-auth";

function createMockRequest(url: string, cookieHeader?: string): Request {
  const req = new Request(url);
  if (cookieHeader) {
    req.headers.append("cookie", cookieHeader);
  }
  return req;
}

describe("Session Persistence & Route Validation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveActor Session Resolution", () => {
    it("should resolve a Better-Auth user session when valid session cookie exists", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce({
        user: {
          id: "user-123",
          email: "admin@example.com",
          name: "Admin User",
          isAdmin: true,
        },
      });

      const request = createMockRequest("http://localhost:3000/dashboard", "better-auth.session_token=valid-token");
      const actor = await resolveActor(request);

      expect(actor).toEqual({
        kind: "user",
        userId: "user-123",
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
      });
    });

    it("should resolve a Customer Portal session when HMAC signed cookie exists", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce(null);
      (verifyCustomerPortalToken as any).mockReturnValueOnce({
        customerId: "cust-456",
        slug: "acme-corp",
        exp: Date.now() + 100000,
      });

      const request = createMockRequest("http://localhost:3000/documents/acme-corp", "customer_portal_session=valid-customer-token");
      const actor = await resolveActor(request);

      expect(actor).toEqual({
        kind: "customer",
        customerId: "cust-456",
        customerSlug: "acme-corp",
      });
      expect(verifyCustomerPortalToken).toHaveBeenCalledWith("valid-customer-token");
    });

    it("should return null when no valid session cookies are present", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce(null);
      (verifyCustomerPortalToken as any).mockReturnValueOnce(null);

      const request = createMockRequest("http://localhost:3000/dashboard");
      const actor = await resolveActor(request);

      expect(actor).toBeNull();
    });

    it("should return null when Customer Portal token signature is invalid", async () => {
      (auth.api.getSession as any).mockResolvedValueOnce(null);
      (verifyCustomerPortalToken as any).mockReturnValueOnce(null);

      const request = createMockRequest("http://localhost:3000/documents/acme-corp", "customer_portal_session=invalid.token.here");
      const actor = await resolveActor(request);

      expect(actor).toBeNull();
    });
  });
});
