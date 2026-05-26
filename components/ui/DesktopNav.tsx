"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, User, Archive } from "flowbite-react-icons/outline";
import { useAuthStore } from "@/store/authStore";

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
  const isCustomer = role === "CUSTOMER";

  const navItems = token
    ? isCollector
      ? [
          { href: "/collector", label: "Dasbor Lapak" },
          { href: "/orders", label: "Pesanan" },
        ]
      : [
          // CUSTOMER atau tidak ada role tapi sudah login
          { href: "/", label: "Beranda" },
          { href: "/search", label: "Cari" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/orders", label: "Pesanan" },
        ]
    : [
        // Belum login
        { href: "/", label: "Beranda" },
        { href: "/search", label: "Cari" },
      ];

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-ink-faint shadow-sm">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-8">
        
        {/* LOGO */}
        <Link href={token ? (isCollector ? "/collector" : "/dashboard") : "/"} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-500 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-sm">R</div>
          <h1 className="font-display font-extrabold text-xl tracking-tight text-ink">Rongsok.in</h1>
        </Link>

        {/* SEARCH BAR — sembunyikan untuk collector */}
        {!isCollector && (
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Cari rongsok, lapak, daerah..." 
              className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-ink-faint rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
            />
            <Search className="w-4 h-4 absolute left-4 top-3 text-ink-muted" />
          </div>
        )}

        {/* NAV LINKS */}
        <nav className="flex items-center gap-6">
          {navItems.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`text-sm font-bold transition-colors ${pathname === item.href ? 'text-brand-500' : 'text-ink-muted hover:text-ink'}`}
            >
              {item.label}
            </Link>
          ))}
          {/* Jual Sekarang hanya untuk CUSTOMER atau belum login */}
          {!isCollector && (
            <Link href={token ? "/orders/new" : "/login"} className="bg-brand-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2">
              <Archive size={16} /> Jual Sekarang
            </Link>
          )}
        </nav>

        {/* PROFILE / ACTIONS */}
        <div className="flex items-center gap-4 shrink-0 border-l border-ink-faint pl-6">
          {token && (
            <button className="text-ink-muted hover:text-ink transition-colors relative p-2">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-status-error rounded-full border border-white"></span>
            </button>
          )}
          <Link href={token ? "/profile" : "/login"} className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors bg-surface-raised px-3 py-1.5 rounded-full border border-ink-faint hover:border-brand-200">
            <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center">
              <User className="text-ink-muted" size={14} />
            </div>
            <span className="text-xs font-bold hidden lg:block">
              {token && user ? user.name : "Masuk"}
            </span>
          </Link>
        </div>

      </div>
    </header>
  );
}
