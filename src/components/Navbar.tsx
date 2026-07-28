import { useSession, signOut } from "@/lib/auth-client";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Logo } from "./Logo";

type Customer = { id: string; name: string; slug: string };

export default function Navbar() {
  const { data: session } = useSession();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeSlug, setActiveSlug] = useState<string>("");

  const { data: customers = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/user/workspaces");
      const data = await res.json();
      return (data.customers as Customer[]) || [];
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (pathname.startsWith("/dashboard/")) {
      const slug = pathname.split("/")[2];
      if (slug) setActiveSlug(slug);
    }
  }, [pathname]);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setActiveSlug(slug);
    navigate({ to: "/dashboard/$customer_slug", params: { customer_slug: slug } });
  };

  if (!session) return null;

  return (
    <nav className="bg-canvas border-b border-border-color transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex flex-1 min-w-0">
            <div className="flex-shrink-0 flex items-center w-24 sm:w-auto overflow-hidden sm:overflow-visible">
              <div className="transform scale-[0.5] sm:scale-75 origin-left">
                <Logo />
              </div>
            </div>

            {customers.length > 0 && (
              <div className="ml-2 sm:ml-6 flex items-center flex-1 sm:flex-initial min-w-0">
                <select
                  value={activeSlug}
                  onChange={handleWorkspaceChange}
                  className="block w-full max-w-full truncate pl-3 pr-10 py-2 text-base border-border-color focus:outline-none focus:ring-primary focus:border-primary sm:text-meta rounded-[var(--radius-button)] bg-surface text-foreground transition-colors duration-200"
                >
                  <option value="" disabled>Select Workspace</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {activeSlug && (
                <Link
                  to="/dashboard/$customer_slug"
                  params={{ customer_slug: activeSlug }}
                  className={`${
                    pathname.includes("/dashboard")
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground-muted hover:border-border-color hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-meta font-medium transition-colors duration-200`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              )}

              {session.user.isAdmin && (
                <Link
                  to="/admin"
                  className={`${
                    pathname.startsWith("/admin")
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground-muted hover:border-border-color hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-meta font-medium transition-colors duration-200`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center flex-shrink-0">
            <span className="hidden sm:inline text-meta text-foreground-muted mr-4">
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 mr-2 rounded-full text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              aria-label="Toggle Theme"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => signOut({ fetchOptions: { onSuccess: () => navigate({ to: "/auth/signin" }) } })}
              className="p-2 rounded-full text-foreground-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
            >
              <span className="sr-only">Sign out</span>
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
