import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface AuthContext {
  userId?: string;
  customerId?: string;
  customerSlug?: string;
  isAdmin?: boolean;
}

export async function validateApiKey(req: Request, targetCustomerSlug?: string): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");

  let apiKey = "";
  if (xApiKey) {
    apiKey = xApiKey;
  } else if (authHeader && authHeader.startsWith("Bearer ")) {
    apiKey = authHeader.split(" ")[1];
  }

  if (!apiKey) return null;

  return validateRawApiKey(apiKey, targetCustomerSlug);
}

export async function validateRawApiKey(apiKey: string, targetCustomerSlug?: string): Promise<AuthContext | null> {
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      customer: true,
      user: {
        include: {
          customers: {
            include: {
              customer: true
            }
          }
        }
      }
    }
  });

  if (!apiKeyRecord) return null;

  // Case 1: Customer-level API Key
  if (apiKeyRecord.customerId) {
    const customer = apiKeyRecord.customer;
    if (!customer || !customer.isActive) return null;

    // If a specific customer slug was requested, ensure it matches
    if (targetCustomerSlug && customer.slug !== targetCustomerSlug) return null;

    return {
      customerId: customer.id,
      customerSlug: customer.slug
    };
  }

  // Case 2: User-level API Key
  if (apiKeyRecord.userId) {
    const user = apiKeyRecord.user;
    if (!user) return null;

    // If a customer slug is provided, verify user access
    if (targetCustomerSlug) {
      const userCustomer = user.customers.find(uc => uc.customer.slug === targetCustomerSlug);

      // Admin bypasses workspace check, but we still need the customer ID if possible
      if (!userCustomer && !user.isAdmin) return null;

      let customer = userCustomer?.customer;

      // If admin and not explicitly member, we need to fetch the customer to get the ID
      if (!customer && user.isAdmin) {
        customer = await prisma.customer.findUnique({ where: { slug: targetCustomerSlug } }) || undefined;
      }

      if (!customer || !customer.isActive) return null;

      return {
        userId: user.id,
        isAdmin: user.isAdmin,
        customerId: customer.id,
        customerSlug: customer.slug
      };
    }

    // No specific customer slug requested, just return user context
    return {
      userId: user.id,
      isAdmin: user.isAdmin
    };
  }

  return null;
}
