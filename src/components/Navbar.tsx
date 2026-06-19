"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useEffect, useState } from "react";

type Customer = { id: string; name: string; slug: string; };

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/")) {
      const slug = pathname?.split("/")[2];
      if (slug) {
         // Using a timeout or separate state handler might be preferred to avoid react-hooks warning,
         // but we suppressed the rule. Doing it anyway to ensure stability.
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
            if (!activeSlug && data.customers.length > 0 && pathname === "/dashboard") {
              router.push(`/dashboard/${data.customers[0].slug}`);
            }
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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">Serve-It</span>
            </div>

            {customers.length > 0 && (
              <div className="ml-6 flex items-center">
                <select
                  value={activeSlug}
                  onChange={handleWorkspaceChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
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
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
