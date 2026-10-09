import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { getAuthSessionFn } from "@/lib/auth-session";
import Navbar from "@/components/Navbar";

export const Route = createFileRoute("/dashboard/")({
  loader: async () => {
    const { actor } = await getAuthSessionFn();
    if (!actor) {
      throw redirect({ to: "/auth/signin", search: { callbackUrl: "/dashboard" } });
    }
    return { actor };
  },
  component: DashboardRoot,
});

function DashboardRoot() {
  const { actor } = Route.useLoaderData();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!actor && !isPending && !session) {
      navigate({ to: "/auth/signin" });
    }
  }, [actor, isPending, session, navigate]);

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <p className="text-foreground-muted">Select a workspace to view files.</p>
      </main>
    </div>
  );
}
