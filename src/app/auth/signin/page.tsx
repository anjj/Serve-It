"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams ? searchParams.get("callbackUrl") : null;

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("customer-auth", {
      slug,
      password,
      callbackUrl: callbackUrl || `/documents/${slug}`
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Welcome to Serve-It</h2>
        </div>

        {!showCustomerLogin ? (
          <div className="flex flex-col gap-4">
            <button onClick={() => signIn("azure-ad", { callbackUrl: callbackUrl || "/dashboard" })} className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Sign in with Microsoft Entra ID
            </button>
            <button onClick={() => setShowCustomerLogin(true)} className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Sign in as Customer
            </button>
            {process.env.NODE_ENV === "development" && (
              <button onClick={() => signIn("credentials", { email: "dev@example.com", isAdmin: "true", callbackUrl: callbackUrl || "/dashboard" })} className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                Bypass: Sign in as Developer Admin
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomerLogin} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Slug</label>
                <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="acme-corp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button type="submit" className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Sign in
              </button>
              <button type="button" onClick={() => setShowCustomerLogin(false)} className="text-sm font-medium text-blue-600 hover:text-blue-500 text-center">
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
