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
  Tags,
  Inbox,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useOrderStore } from "@/store/orderStore";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  isCenter?: boolean;
  badge?: number;
};

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const incomingCount = useOrderStore((state) => state.incomingOrders.length);

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
      { href: "/collector#katalog", label: "Katalog", icon: Tags },
      {
        href: "/collector#antrean",
        label: "Antrean",
        icon: Inbox,
        isCenter: true,
        badge: incomingCount,
      },
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
      { href: "/search", label: "Cari", icon: Search },
      { href: token ? "/orders/new" : "/login", label: "Jual", icon: Plus, isCenter: true },
      { href: "/orders", label: "Pesanan", icon: Clock },
      { href: "/profile", label: "Profil", icon: User },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t border-ink-faint px-6 py-2 flex justify-between items-center z-50 md:hidden">
      {navItems.map((item) => {
        // Link ber-hash (mis. /collector#katalog) tidak ikut highlight aktif —
        // biar tidak dobel dengan item path yang sama.
        const isActive =
          !item.href.includes("#") &&
          (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));

        // Next Link tidak meng-update hash saat sudah berada di path yang sama —
        // set manual supaya listener hashchange di halaman tetap jalan.
        const handleHashClick = (e: React.MouseEvent) => {
          const [path, hash] = item.href.split("#");
          if (!hash || window.location.pathname !== path) return;
          e.preventDefault();
          if (window.location.hash === `#${hash}`) {
            window.dispatchEvent(new HashChangeEvent("hashchange"));
          } else {
            window.location.hash = `#${hash}`;
          }
        };

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleHashClick}
              className="flex flex-col items-center gap-1 text-ink"
            >
              <div className="relative w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center -mt-7 border-4 border-surface text-ink">
                <item.icon size={24} strokeWidth={2.5} />
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-ink text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-ink">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleHashClick}
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
