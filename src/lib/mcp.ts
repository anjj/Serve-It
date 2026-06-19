import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AuthContext } from "./auth-api";
import { prisma } from "./prisma";
import { createDocument, patchDocument } from "./documents";

/**
 * Global session registry for MCP Streamable HTTP transports.
 * Uses globalThis to persist across Next.js HMR in development.
 */
const globalForMCP = globalThis as unknown as {
  mcpSessions: Map<string, StreamableHTTPServerTransport> | undefined;
};

export const mcpSessions = globalForMCP.mcpSessions ?? new Map<string, StreamableHTTPServerTransport>();

if (process.env.NODE_ENV !== "production") {
  globalForMCP.mcpSessions = mcpSessions;
}

/**
 * Creates and configures an MCP Server with tools scoped to the authenticated user's permissions.
 * The server exposes get_customers, post_file, and patch_file tools.
 */
export function createMCPServer(auth: AuthContext) {
  const server = new Server(
    {
      name: "serve-it-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_customers",
          description: "List customers (workspaces) the authenticated user has access to.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "post_file",
          description: "Creates a new document in a specific workspace.",
          inputSchema: {
            type: "object",
            properties: {
              customer_slug: { type: "string", description: "The workspace slug" },
              title: { type: "string", description: "Title of the document" },
              slug: { type: "string", description: "URL-friendly slug for the document" },
              content: { type: "string", description: "HTML content of the document" },
              tags: { type: "array", items: { type: "string" }, description: "Optional tags" },
              metadata: { type: "object", description: "Optional metadata" },
            },
            required: ["customer_slug", "title", "slug", "content"],
          },
        },
        {
          name: "patch_file",
          description: "Updates an existing document in a specific workspace.",
          inputSchema: {
            type: "object",
            properties: {
              customer_slug: { type: "string", description: "The workspace slug" },
              slug: { type: "string", description: "The slug of the document to update" },
              title: { type: "string", description: "New title (optional)" },
              content: { type: "string", description: "New HTML content (optional)" },
              tags: { type: "array", items: { type: "string" }, description: "New tags (optional)" },
              metadata: { type: "object", description: "New metadata (optional)" },
            },
            required: ["customer_slug", "slug"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "get_customers") {
        if (auth.customerId) {
          // Customer-level API key: return only the bound customer
          const customer = await prisma.customer.findUnique({ where: { id: auth.customerId } });
          return {
            content: [{ type: "text", text: JSON.stringify(customer ? [customer] : []) }],
          };
        } else if (auth.userId) {
          // User-level API key: return all accessible customers
          if (auth.isAdmin) {
            const customers = await prisma.customer.findMany({ where: { isActive: true } });
            return {
              content: [{ type: "text", text: JSON.stringify(customers) }],
            };
          } else {
            const userCustomers = await prisma.userCustomer.findMany({
              where: { userId: auth.userId },
              include: { customer: true },
            });
            const customers = userCustomers.map(uc => uc.customer).filter(c => c.isActive);
            return {
              content: [{ type: "text", text: JSON.stringify(customers) }],
            };
          }
        }
        return {
          content: [{ type: "text", text: "[]" }],
        };
      }

      if (name === "post_file" || name === "patch_file") {
        const customer_slug = args?.customer_slug as string;
        if (!customer_slug) throw new Error("customer_slug is required");

        // Resolve and verify customer access for the authenticated context
        let activeCustomerId = auth.customerId;
        
        if (!activeCustomerId && auth.userId) {
          if (auth.isAdmin) {
            const c = await prisma.customer.findUnique({ where: { slug: customer_slug } });
            if (c) activeCustomerId = c.id;
          } else {
            const uc = await prisma.userCustomer.findFirst({
              where: { userId: auth.userId, customer: { slug: customer_slug } },
              include: { customer: true }
            });
            if (uc) activeCustomerId = uc.customerId;
          }
        } else if (auth.customerSlug && auth.customerSlug !== customer_slug) {
            throw new Error(`Unauthorized access to workspace: ${customer_slug}`);
        }

        if (!activeCustomerId) {
          throw new Error(`Unauthorized access to workspace: ${customer_slug}`);
        }

        if (name === "post_file") {
          const result = await createDocument(activeCustomerId, {
            title: args?.title as string,
            slug: args?.slug as string,
            content: args?.content as string,
            tags: args?.tags as string[],
            metadata: args?.metadata as Record<string, any>,
          });
          const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${customer_slug}/${result.slug}`;
          return { content: [{ type: "text", text: `Document created successfully: ${url}` }] };
        }

        if (name === "patch_file") {
          const result = await patchDocument(activeCustomerId, args?.slug as string, {
            title: args?.title as string,
            content: args?.content as string,
            tags: args?.tags as string[],
            metadata: args?.metadata as Record<string, any>,
          });
          const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${customer_slug}/${result.slug}`;
          return { content: [{ type: "text", text: `Document updated successfully: ${url}` }] };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  return server;
}
