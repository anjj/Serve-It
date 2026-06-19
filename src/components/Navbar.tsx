"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Settings, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Logo } from "./Logo";

type Customer = { id: string; name: string; slug: string; };

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/")) {
      const slug = pathname?.split("/")[2];
      if (slug) {
         setTimeout(() => setActiveSlug(slug), 0);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/workspaces")
        .then((res) => res.json())
        .then((data) => {
          if (data.customers) {
            setCustomers(data.customers);
          }
        });
    }
  }, [session, router, activeSlug, pathname]);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    setActiveSlug(slug);
    router.push(`/dashboard/${slug}`);
  };

  if (!session) return null;

  return (
    <nav className="bg-background border-b border-border-color transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="transform scale-[0.5] sm:scale-75 origin-left">
                <Logo />
              </div>
            </div>

            {customers.length > 0 && (
              <div className="ml-6 flex items-center">
                <select
                  value={activeSlug}
                  onChange={handleWorkspaceChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-border-color focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-[var(--radius-button)] bg-background-alternate text-foreground transition-colors duration-200"
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
                  href={`/dashboard/${activeSlug}`}
                  className={`${
                    pathname?.includes("/dashboard")
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground-muted hover:border-border-color hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              )}

              {(session.user as any).isAdmin && (
                <Link
                  href="/admin"
                  className={`${
                    pathname?.startsWith("/admin")
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground-muted hover:border-border-color hover:text-foreground"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-foreground-muted mr-4">
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
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
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
