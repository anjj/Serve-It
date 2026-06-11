"use client";
import { signIn } from "next-auth/react";
export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Welcome to Serve-It</h2>
        </div>
        <div>
          <button onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })} className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Sign in with Microsoft Entra ID
          </button>
        </div>
      </div>
    </div>
  );
}
