"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("customer-auth", {
      slug,
      password,
      callbackUrl: callbackUrl || `/documents/${slug}`
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0B0F19] px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">Welcome to Serve-It</h2>
        </div>

        {!showCustomerLogin ? (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => signIn("azure-ad", { callbackUrl: callbackUrl || "/dashboard" })}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Sign in with Microsoft Entra ID
            </button>
            <button
              onClick={() => setShowCustomerLogin(true)}
              className="group relative flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Sign in as Customer
            </button>
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => signIn("credentials", { email: "dev@example.com", isAdmin: "true", callbackUrl: callbackUrl || "/dashboard" })}
                className="group relative flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Bypass: Sign in as Developer Admin
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomerLogin} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Customer Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="relative block w-full rounded-md border border-gray-300 dark:border-zinc-700 py-1.5 px-3 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 sm:text-sm transition-colors duration-200"
                  placeholder="acme-corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-md border border-gray-300 dark:border-zinc-700 py-1.5 px-3 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 sm:text-sm transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setShowCustomerLogin(false)}
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-center transition-colors cursor-pointer"
              >
                Back to employee login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0B0F19] text-zinc-900 dark:text-zinc-100">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
