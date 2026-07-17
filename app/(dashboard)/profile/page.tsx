"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  MapPin,
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useMe } from "@/hooks/useAuth";
import { useCollectorProfile } from "@/hooks/useCollector";
import { useOrdersList } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import { formatRupiah, getOrderTotalPrice } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me, isLoading: isMeLoading } = useMe();
  const isCollector = me?.role === "COLLECTOR";
  const { data: collectorProfile } = useCollectorProfile();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({
    role: me?.role === "COLLECTOR" ? "collector" : "customer",
    limit: 100,
  });

  const completedOrders = orders?.filter((o) => o.status === "COMPLETED") || [];
  const totalTransactions = completedOrders.length;
  const totalCuan = completedOrders.reduce((sum, o) => sum + getOrderTotalPrice(o), 0);

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar dari akun.");
    router.push("/login");
  };

  const isPageLoading = isMeLoading || isOrdersLoading;

  if (isPageLoading) {
    return <ProfileSkeleton />;
  }

  interface MenuItem {
    icon: any;
    label: string;
    href?: string;
    toast?: string;
  }

  const menuGroups: MenuItem[][] = [
    [
      { icon: User, label: "Edit Profil", href: "/profile/edit" },
      { icon: MapPin, label: "Alamat & Lokasi", href: "/profile/edit" },
      { icon: CreditCard, label: "Rekening & E-Wallet", toast: "Fitur Rekening segera hadir!" },
    ],
    [
      { icon: HelpCircle, label: "Pusat Bantuan", toast: "Fitur Pusat Bantuan segera hadir!" },
      { icon: FileText, label: "Syarat & Ketentuan", toast: "Syarat & Ketentuan Rongsok.in" },
    ],
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-0 py-5 md:py-8 space-y-5">
        {/* PROFILE SUMMARY */}
        <header className="bg-surface-raised rounded-2xl overflow-hidden flex flex-col">
          {isCollector && (
            <div className="w-full h-24 md:h-32 bg-brand-100 relative overflow-hidden">
              {collectorProfile?.shopImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={collectorProfile.shopImageUrl}
                  alt="Sampul lapak"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
          <div className="p-6 flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full bg-brand-100 mb-4 relative overflow-visible ${isCollector ? "-mt-16 border-4 border-surface-raised z-10" : ""}`}>
              {me?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={me.avatarUrl}
                  alt={me.name || "Avatar"}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink rounded-full">
                  <User size={40} />
                </div>
              )}
              <Link
                href="/profile/edit"
                className="absolute -bottom-1 -right-1 bg-brand-500 text-ink p-2 rounded-full border-2 border-surface-raised hover:bg-brand-600 transition-colors z-10"
                aria-label="Edit profil"
              >
                <Settings size={14} />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-lg text-ink">
                {me?.name || "User Rongsok.in"}
              </h2>
              {me?.isVerified && <VerifiedBadge size="xs" />}
            </div>
            <p className="text-xs font-semibold text-mute uppercase tracking-widest mt-1">
              {me?.phone || me?.email || "Tidak ada kontak"}
            </p>
            {me && !me.isVerified && (
              <Link
                href="/profile/verify"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-ink bg-brand-100 border border-brand-200 rounded-full px-3 py-1.5 hover:bg-brand-200 transition-colors"
              >
                <ShieldAlert size={13} className="text-brand-700" />
                Verifikasi KTP sekarang
              </Link>
            )}

            <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-3">
              <div className="bg-surface p-4 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-1">
                  {me?.role === "COLLECTOR" ? "Total Keluar" : "Total Cuan"}
                </span>
                <span className="font-extrabold text-ink font-mono text-base">
                  {formatRupiah(totalCuan)}
                </span>
              </div>
              <div className="bg-surface p-4 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-mute uppercase tracking-widest mb-1">
                  Transaksi
                </span>
                <span className="font-extrabold text-ink font-mono text-base">
                  {totalTransactions} Kali
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MENU GROUPS */}
        <section className="space-y-4">
          {menuGroups.map((group, gi) => (
            <div key={gi} className="bg-surface-raised rounded-2xl overflow-hidden">
              {group.map((item, ii) => {
                const baseCls = `w-full p-4 flex items-center justify-between cursor-pointer hover:bg-brand-100 group transition-colors text-left ${
                  ii < group.length - 1 ? "border-b border-ink-faint" : ""
                }`;
                const inner = (
                  <>
                    <div className="flex items-center gap-4">
                      <item.icon
                        size={20}
                        className="text-ink-muted group-hover:text-ink transition-colors"
                      />
                      <span className="text-sm font-bold text-ink">{item.label}</span>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-ink-faint group-hover:text-ink transition-colors"
                    />
                  </>
                );
                if (item.href) {
                  return (
                    <Link key={item.label} href={item.href} className={baseCls}>
                      {inner}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    onClick={() => item.toast && toast.success(item.toast)}
                    className={baseCls}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          ))}

          <button
            onClick={handleLogout}
            className="w-full py-4 text-sm font-bold text-status-error bg-surface-raised rounded-2xl hover:bg-status-error/5 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={18} /> Keluar Akun
          </button>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
