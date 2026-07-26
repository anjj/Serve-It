import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Logo } from "@/components/Logo";
import { FaMicrosoft, FaGoogle } from "react-icons/fa";
import { User } from "lucide-react";

const getAuthProviders = createServerFn({ method: "GET" }).handler(async () => ({
  showGoogle: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  showAzure: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET),
  isDev: process.env.NODE_ENV === "development",
}));

export const Route = createFileRoute("/auth/signin")({
  validateSearch: (search: Record<string, unknown>): { callbackUrl?: string } => ({
    ...(typeof search.callbackUrl === "string" ? { callbackUrl: search.callbackUrl } : {}),
  }),
  loader: () => getAuthProviders(),
  component: SignInPage,
});

function SignInPage() {
  const { showGoogle, showAzure, isDev } = Route.useLoaderData();
  const { callbackUrl } = Route.useSearch();

  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/customer-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, password }),
    });
    if (!res.ok) {
      setError("Invalid slug or password.");
      return;
    }
    window.location.href = callbackUrl || `/documents/${slug}`;
  };

  const handleDevBypass = async () => {
    await fetch("/api/auth/dev-bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dev@example.com", isAdmin: true }),
    });
    window.location.href = callbackUrl || "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <Card className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo className="scale-75 origin-center" />
        </div>

        {!showCustomerLogin ? (
          <div className="flex flex-col gap-4 mt-8">
            {showGoogle && (
              <Button
                onClick={() => authClient.signIn.social({ provider: "google", callbackURL: callbackUrl || "/dashboard" })}
                className="w-full"
              >
                <FaGoogle className="mr-2 h-4 w-4" />
                Google Login
              </Button>
            )}
            {showAzure && (
              <Button
                onClick={() => authClient.signIn.social({ provider: "microsoft", callbackURL: callbackUrl || "/dashboard" })}
                className="w-full"
              >
                <FaMicrosoft className="mr-2 h-4 w-4" />
                Microsoft Login
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowCustomerLogin(true)}
              className="w-full"
            >
              <User className="mr-2 h-4 w-4" />
              Client Authentication
            </Button>
            {isDev && (
              <Button
                variant="danger"
                onClick={handleDevBypass}
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

            {error && <p className="text-meta text-red-600">{error}</p>}

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
