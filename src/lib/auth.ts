import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

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
              return user as any;
            },
          }),
        ]
      : []),
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
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
};
