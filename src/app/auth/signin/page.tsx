"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0B0F19] px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Welcome to Serve-It</h2>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Sign in with Microsoft Entra ID
          </button>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => signIn("credentials", { email: "dev@example.com", isAdmin: "true", callbackUrl: "/dashboard" })}
              className="group relative flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Bypass: Sign in as Developer Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
