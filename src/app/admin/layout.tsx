"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    else if (status === "authenticated" && !(session?.user as any)?.isAdmin) router.push("/dashboard");
  }, [status, session, router]);

  if (status === "loading" || !session || !(session.user as any)?.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-surface-hover flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-border-color flex-shrink-0">
          <nav className="mt-5 px-2 space-y-1">
            <Link href="/admin/customers" className={`${pathname.startsWith("/admin/customers") ? "bg-surface-hover text-gray-900" : "text-gray-600 hover:bg-surface-hover hover:text-gray-900"} group flex items-center px-2 py-2 text-meta font-medium rounded-md`}>Customers</Link>
            <Link href="/admin/users" className={`${pathname.startsWith("/admin/users") ? "bg-surface-hover text-gray-900" : "text-gray-600 hover:bg-surface-hover hover:text-gray-900"} group flex items-center px-2 py-2 text-meta font-medium rounded-md`}>Users & Mapping</Link>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
