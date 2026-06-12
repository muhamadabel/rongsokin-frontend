"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import { PageSkeleton } from "@/components/ui/Skeleton";

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

  // Notifikasi real-time (polling fallback) — pasang sekali utk seluruh dashboard
  useNotifications();

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
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
