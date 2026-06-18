"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("customer-auth", {
      slug,
      password,
      redirect: false,
      callbackUrl: callbackUrl || `/documents/${slug}`,
    });

    if (result?.error) {
      setError("Invalid customer slug or password");
    } else if (result?.url) {
      router.push(result.url);
    }
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
              onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Sign in with Microsoft Entra ID
            </button>
            <button
              onClick={() => setShowCustomerLogin(true)}
              className="group relative flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-750 bg-white dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Sign in as Customer
            </button>
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => signIn("credentials", { email: "dev@example.com", isAdmin: "true", callbackUrl: callbackUrl || "/dashboard" })}
                className="group relative flex w-full justify-center rounded-md border border-gray-300 dark:border-zinc-750 bg-gray-100 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Bypass: Sign in as Developer Admin
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomerLogin} className="mt-8 space-y-6">
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Customer Slug</label>
                <input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="acme-corp"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white dark:bg-zinc-800 ring-1 ring-inset ring-gray-300 dark:ring-zinc-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setShowCustomerLogin(false)}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 text-center"
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
