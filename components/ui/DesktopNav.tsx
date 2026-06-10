"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  User,
  Home,
  Search,
  LayoutDashboard,
  Clock,
  Store,
  Plus,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number }> };

export default function DesktopNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const role = user?.role;
  const isCollector = role === "COLLECTOR";
  const isAdmin = role === "ADMIN";

  // Tujuan "home" sesuai peran — tanpa Beranda saat sudah login
  const homeHref = !token
    ? "/"
    : isAdmin
    ? "/admin"
    : isCollector
    ? "/collector"
    : "/dashboard";

  const navItems: NavItem[] = !token
    ? [
        { href: "/", label: "Beranda", icon: Home },
        { href: "/search", label: "Cari", icon: Search },
      ]
    : isAdmin
    ? [{ href: "/admin", label: "Console", icon: ShieldCheck }]
    : isCollector
    ? [
        { href: "/collector", label: "Dasbor Lapak", icon: Store },
        { href: "/orders", label: "Pesanan", icon: Clock },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/search", label: "Cari", icon: Search },
        { href: "/orders", label: "Pesanan", icon: Clock },
        { href: "/eco", label: "Eco", icon: Leaf },
      ];

  const showSellCta = !isCollector && !isAdmin;

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-surface-raised border-b border-ink-faint">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-6">
        {/* LOGO */}
        <Link href={homeHref} className="flex items-center gap-2 shrink-0">
          <Logo size={36} />
          <h1 className="font-display font-extrabold text-xl tracking-tight text-ink">
            Rongsok.in
          </h1>
        </Link>

        {/* NAV LINKS — pill aktif */}
        <nav className="flex items-center gap-1.5 ml-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-full transition-colors ${
                  isActive
                    ? "bg-brand-100 text-ink"
                    : "text-mute hover:text-ink hover:bg-surface"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {showSellCta && (
            <Link
              href={token ? "/orders/new" : "/register"}
              className="bg-brand-500 text-ink text-sm font-semibold px-5 py-2.5 rounded-2xl hover:bg-brand-600 transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} /> Jual Sekarang
            </Link>
          )}

          {token && (
            <button className="text-mute hover:text-ink transition-colors relative p-2">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-status-error rounded-full border border-surface-raised"></span>
            </button>
          )}

          <Link
            href={token ? "/profile" : "/login"}
            className="flex items-center gap-2 text-ink hover:bg-surface transition-colors px-2.5 py-1.5 rounded-2xl border border-ink-faint"
          >
            <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-ink font-bold text-xs overflow-hidden">
              {token && user?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : token && user ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <User size={14} />
              )}
            </div>
            <span className="text-xs font-bold hidden lg:block max-w-[110px] truncate">
              {token && user ? user.name : "Masuk"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
