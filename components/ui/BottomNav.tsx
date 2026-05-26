"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Clock, User, Store } from "flowbite-react-icons/outline";
import { useAuthStore } from "@/store/authStore";

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const role = user?.role;
  const isCollector = role === "COLLECTOR";

  // Nav items berbeda per role
  const navItems = isCollector
    ? [
        { href: "/collector", label: "Lapak", icon: Store },
        { href: "/orders", label: "Pesanan", icon: Clock },
        { href: "/profile", label: "Profil", icon: User },
      ]
    : [
        { href: "/", label: "Beranda", icon: Home },
        { href: "/search", label: "Cari", icon: Search },
        { href: token ? "/orders/new" : "/login", label: "Jual", icon: Plus, isCenter: true },
        { href: "/orders", label: "Pesanan", icon: Clock },
        { href: "/profile", label: "Profil", icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ink-faint px-6 py-2 flex justify-between items-center z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        
        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-ink-muted">
              <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center -mt-6 border-4 border-white text-white shadow-md">
                <item.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-brand-500">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand-500' : 'text-ink-muted hover:text-ink'}`}>
            <item.icon size={24} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
