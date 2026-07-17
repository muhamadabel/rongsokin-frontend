"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  Clock,
  User,
  Store,
  LayoutDashboard,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isCenter?: boolean;
};

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const role = user?.role;
  const isCollector = role === "COLLECTOR";
  const isAdmin = role === "ADMIN";

  let navItems: NavItem[];

  if (isAdmin) {
    navItems = [
      { href: "/admin", label: "Console", icon: ShieldCheck },
      { href: "/orders", label: "Pesanan", icon: Clock },
      { href: "/profile", label: "Profil", icon: User },
    ];
  } else if (isCollector) {
    navItems = [
      { href: "/collector", label: "Lapak", icon: Store },
      { href: "/orders", label: "Pesanan", icon: Clock },
      { href: "/profile", label: "Profil", icon: User },
    ];
  } else {
    // Customer / belum login — Beranda hanya saat belum login
    const homeItem: NavItem = token
      ? { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
      : { href: "/", label: "Beranda", icon: Home };

    navItems = [
      homeItem,
      { href: "/orders", label: "Riwayat", icon: Clock },
      { href: token ? "/orders/new" : "/login", label: "Jual", icon: Plus, isCenter: true },
      // Item ini konsisten dgn DesktopNav customer yang sudah punya Eco.
      { href: "/eco", label: "Eco", icon: Leaf },
      { href: "/profile", label: "Profil", icon: User },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-ink-faint px-3 py-2 flex justify-between items-center z-50 md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-ink"
            >
              <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center -mt-7 border-4 border-surface text-ink">
                <item.icon size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-ink">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-ink" : "text-mute hover:text-ink"
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition-colors ${
                isActive ? "bg-brand-100" : "bg-transparent"
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
