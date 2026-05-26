"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Refresh } from "flowbite-react-icons/outline";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initFromStorage = useAuthStore((state) => state.initFromStorage);
  const user = useAuthStore((state) => state.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    initFromStorage();
    
    const storedToken = localStorage.getItem("token");
    const storedUserStr = localStorage.getItem("user");
    const isPublicPath = pathname.startsWith("/pengepul");
    
    if (!storedToken && !isPublicPath) {
      router.push("/login");
      return;
    }

    // Role guard: /collector/* hanya untuk COLLECTOR
    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        const role = storedUser?.role;

        if (pathname.startsWith("/collector") && role !== "COLLECTOR") {
          router.push("/dashboard");
          return;
        }

        // /dashboard hanya untuk CUSTOMER
        if (pathname.startsWith("/dashboard") && role === "COLLECTOR") {
          router.push("/collector");
          return;
        }
      } catch {
        // invalid user data
      }
    }

    setIsChecking(false);
  }, [initFromStorage, router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Refresh className="w-10 h-10 text-brand-500 animate-spin" />
          <span className="text-sm font-bold text-ink-muted">Memverifikasi sesi Anda...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
