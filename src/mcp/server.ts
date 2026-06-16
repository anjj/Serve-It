#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { validateRawApiKey } from "../lib/auth-api.js";
import { createDocument, patchDocument } from "../lib/documents.js";

/**
 * MCP Sidecar Server for Serve-It
 *
 * Exposes tools to create and update documents.
 * Requires SERVE_IT_API_KEY environment variable (User-level API Key).
 */

const API_KEY = process.env.SERVE_IT_API_KEY;

if (!API_KEY) {
  console.error("SERVE_IT_API_KEY environment variable is required");
  process.exit(1);
}

const server = new Server(
  {
    name: "serve-it-sidecar",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_new_document",
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
        name: "patch_document",
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

// Register Tool Call Handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const customer_slug = args?.customer_slug as string;
    if (!customer_slug) {
      throw new Error("customer_slug is required");
    }

    // Authenticate the request using the provided API Key for the specific customer
    const auth = await validateRawApiKey(API_KEY, customer_slug);
    if (!auth || !auth.customerId) {
      throw new Error(`Unauthorized access to workspace: ${customer_slug}`);
    }

    switch (name) {
      case "create_new_document": {
        const result = await createDocument(auth.customerId, {
          title: args?.title as string,
          slug: args?.slug as string,
          content: args?.content as string,
          tags: args?.tags as string[],
          metadata: args?.metadata as Record<string, any>,
        });

        const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${customer_slug}/${result.slug}`;

        return {
          content: [
            {
              type: "text",
              text: `Document created successfully: ${url}`,
            },
          ],
        };
      }

      case "patch_document": {
        const result = await patchDocument(auth.customerId, args?.slug as string, {
          title: args?.title as string,
          content: args?.content as string,
          tags: args?.tags as string[],
          metadata: args?.metadata as Record<string, any>,
        });

        const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/s/${customer_slug}/${result.slug}`;

        return {
          content: [
            {
              type: "text",
              text: `Document updated successfully: ${url}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Serve-It MCP Sidecar started on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
