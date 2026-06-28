"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Logo } from "@/components/Logo";
import { FaMicrosoft } from "react-icons/fa";
import { User } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <Card className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo className="scale-75 origin-center" />
        </div>

        {!showCustomerLogin ? (
          <div className="flex flex-col gap-4 mt-8">
            <Button
              onClick={() => signIn("azure-ad", { callbackUrl: callbackUrl || "/dashboard" })}
              className="w-full"
            >
              <FaMicrosoft className="mr-2 h-4 w-4" />
              Microsoft Login
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCustomerLogin(true)}
              className="w-full"
            >
              <User className="mr-2 h-4 w-4" />
              Client Authentication
            </Button>
            {process.env.NODE_ENV === "development" && (
              <Button
                variant="danger"
                onClick={() => signIn("credentials", { email: "dev@example.com", isAdmin: "true", callbackUrl: callbackUrl || "/dashboard" })}
                className="w-full mt-4"
              >
                Developer Override: Admin Access
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCustomerLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-meta font-medium text-foreground mb-1">Customer Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="relative block w-full rounded-[var(--radius-button)] border border-border-color py-1.5 px-3 text-foreground bg-surface placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary sm:text-meta transition-colors duration-200"
                  placeholder="acme-corp"
                />
              </div>
              <div>
                <label className="block text-meta font-medium text-foreground mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full rounded-[var(--radius-button)] border border-border-color py-1.5 px-3 text-foreground bg-surface placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary sm:text-meta transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              <button
                type="button"
                onClick={() => setShowCustomerLogin(false)}
                className="text-meta font-medium text-foreground-muted hover:text-foreground text-center transition-colors cursor-pointer"
              >
                Return to Employee Portal
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-canvas text-foreground">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
