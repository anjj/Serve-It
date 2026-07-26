import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/Navbar";

export const Route = createFileRoute("/dashboard/")({ component: DashboardRoot });

function DashboardRoot() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && !session) navigate({ to: "/auth/signin" });
  }, [isPending, session, navigate]);

  if (isPending) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <p className="text-foreground-muted">Select a workspace to view files.</p>
      </main>
    </div>
  );
}
