import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "./security-logger";

export type AuthUser = {
  id: string;
  role: string;
  isAdmin: boolean;
  customer_slug?: string;
};

export async function validateTenantAccess(
  user: AuthUser,
  customer_slug: string,
  requestDetails: { ip?: string; resource: string; action: string }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { slug: customer_slug },
      include: {
        users: {
          where: { userId: user.id },
        },
      },
    });

    if (!customer) {
      await logSecurityEvent({
        actorId: user.id,
        action: requestDetails.action,
        resource: requestDetails.resource,
        tenantId: customer_slug,
        ipAddress: requestDetails.ip,
        status: "FAILURE",
        details: "Workspace not found",
      });
      return { authorized: false, status: 404, error: "Workspace not found" };
    }

    let authorized = false;

    if (user.role === "CUSTOMER") {
      // Credentials-based customer user
      authorized = user.customer_slug === customer_slug;
    } else {
      // SSO-based full user
      authorized = user.isAdmin || customer.users.length > 0;
    }

    if (!authorized) {
      await logSecurityEvent({
        actorId: user.id,
        action: requestDetails.action,
        resource: requestDetails.resource,
        tenantId: customer_slug,
        ipAddress: requestDetails.ip,
        status: "FAILURE",
        details: "Access denied: User does not have permission for this tenant",
      });
      return { authorized: false, status: 403, error: "Access denied" };
    }

    return { authorized: true, customer };
  } catch (error: any) {
    console.error("Error in validateTenantAccess:", error);
    return { authorized: false, status: 500, error: "Internal Server Error" };
  }
}
