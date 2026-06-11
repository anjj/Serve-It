"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/customers"); }, [router]);
  return null;
}
