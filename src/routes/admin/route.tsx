import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/Navbar";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!isPending && !session) navigate({ to: "/auth/signin" });
    else if (!isPending && session && !session.user.isAdmin) navigate({ to: "/dashboard" });
  }, [isPending, session, navigate]);

  if (isPending || !session || !session.user.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-surface-hover flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-border-color flex-shrink-0">
          <nav className="mt-5 px-2 space-y-1">
            <Link
              to="/admin/customers"
              className={`${pathname.startsWith("/admin/customers") ? "bg-surface-hover text-gray-900" : "text-gray-600 hover:bg-surface-hover hover:text-gray-900"} group flex items-center px-2 py-2 text-meta font-medium rounded-md`}
            >
              Customers
            </Link>
            <Link
              to="/admin/users"
              className={`${pathname.startsWith("/admin/users") ? "bg-surface-hover text-gray-900" : "text-gray-600 hover:bg-surface-hover hover:text-gray-900"} group flex items-center px-2 py-2 text-meta font-medium rounded-md`}
            >
              Users & Mapping
            </Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
