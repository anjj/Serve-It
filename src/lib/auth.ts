import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            name: "Developer Bypass",
            credentials: {
              email: { label: "Email", type: "text", placeholder: "dev@example.com" },
              isAdmin: { label: "Admin? (true/false)", type: "text", placeholder: "true" },
            },
            async authorize(credentials) {
              const email = credentials?.email || "dev@example.com";
              const isAdmin = credentials?.isAdmin === "true";

              // Find or create test user
              let user = await prisma.user.findUnique({ where: { email } });
              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: "Developer User",
                    isAdmin,
                  },
                });
              } else if (user.isAdmin !== isAdmin) {
                user = await prisma.user.update({
                  where: { id: user.id },
                  data: { isAdmin }
                });
              }
              return { ...user, role: "FULL" } as any;
            },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "customer-auth",
      name: "Customer Portal",
      credentials: {
        slug: { label: "Customer Slug", type: "text", placeholder: "acme-corp" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.slug || !credentials?.password) return null;

        const customer = await prisma.customer.findUnique({
          where: { slug: credentials.slug },
        });

        if (!customer) return null;
        if (!customer.isActive) return null;
        if (!customer.passwordHash) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, customer.passwordHash);
        if (!isPasswordValid) return null;

        return {
          id: customer.id,
          name: customer.name,
          role: "CUSTOMER",
          customer_slug: customer.slug,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "FULL";
        token.isAdmin = (user as any).isAdmin || false;
        if ((user as any).customer_slug) {
          token.customer_slug = (user as any).customer_slug;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        if (token.customer_slug) {
          (session.user as any).customer_slug = token.customer_slug as string;
        }
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
};
