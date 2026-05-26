"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Cog, MapPinAlt, CreditCard, QuestionCircle, FileLines, ArrowRightToBracket, ChevronRight, Refresh } from "flowbite-react-icons/outline";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { useMe } from "@/hooks/useAuth";
import { useOrdersList } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/authStore";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const { data: me, isLoading: isMeLoading } = useMe();
  const { data: orders, isLoading: isOrdersLoading } = useOrdersList({
    role: me?.role === "COLLECTOR" ? "collector" : "customer",
    limit: 100,
  });

  const completedOrders = orders?.filter((o) => o.status === "COMPLETED") || [];
  const totalTransactions = completedOrders.length;
  
  const totalCuan = completedOrders.reduce(
    (sum, o) => sum + (o.totalPrice || o.agreedPrice || 0),
    0
  );

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar dari akun.");
    router.push("/login");
  };

  const isPageLoading = isMeLoading || isOrdersLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-24 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Refresh className="w-10 h-10 text-brand-500 animate-spin" />
            <span className="text-sm font-bold text-ink-muted">Memuat profil...</span>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-0 md:py-8 md:space-y-6">
        
        {/* HEADER / PROFILE SUMMARY */}
        <header className="bg-white md:rounded-2xl md:shadow-sm md:border border-b border-ink-faint p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-brand-50 p-1 mb-4 relative">
            <div className="w-full h-full bg-surface-raised rounded-full flex items-center justify-center text-ink-muted">
              <User size={40} />
            </div>
            <button className="absolute bottom-0 right-0 bg-brand-500 text-white p-2 rounded-full border-2 border-white shadow-md hover:bg-brand-600 transition-colors">
              <Cog size={14} />
            </button>
          </div>
          <h2 className="font-display font-extrabold text-lg text-ink">{me?.name || "User Rongsok.in"}</h2>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mt-1">
            {me?.phone || me?.email || "Tidak ada nomor WA"}
          </p>
          
          <div className="mt-6 w-full max-w-sm grid grid-cols-2 gap-4">
            <div className="bg-surface-raised p-4 rounded-xl border border-ink-faint text-center shadow-sm">
              <span className="block text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">
                {me?.role === "COLLECTOR" ? "Total Keluar" : "Total Cuan"}
              </span>
              <span className="font-black text-brand-600 font-mono text-base">
                {formatRupiah(totalCuan)}
              </span>
            </div>
            <div className="bg-surface-raised p-4 rounded-xl border border-ink-faint text-center shadow-sm">
              <span className="block text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-1">Transaksi</span>
              <span className="font-black text-ink font-mono text-base">{totalTransactions} Kali</span>
            </div>
          </div>
        </header>

        {/* MENU GROUPS */}
        <section className="mt-6 space-y-4">
          <div className="bg-white border border-ink-faint rounded-2xl overflow-hidden shadow-sm">
            <div 
              onClick={() => toast.success("Fitur Edit Profil segera hadir!")}
              className="bg-white border-b border-ink-faint p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <User size={20} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">Edit Profil</span>
              </div>
              <ChevronRight size={18} className="text-ink-faint group-hover:text-brand-500 transition-colors" />
            </div>
            <div 
              onClick={() => toast.success("Fitur Daftar Alamat segera hadir!")}
              className="bg-white border-b border-ink-faint p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <MapPinAlt size={20} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">Daftar Alamat</span>
              </div>
              <ChevronRight size={18} className="text-ink-faint group-hover:text-brand-500 transition-colors" />
            </div>
            <div 
              onClick={() => toast.success("Fitur Rekening & E-Wallet segera hadir!")}
              className="bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <CreditCard size={20} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">Rekening & E-Wallet</span>
              </div>
              <ChevronRight size={18} className="text-ink-faint group-hover:text-brand-500 transition-colors" />
            </div>
          </div>

          <div className="bg-white border border-ink-faint rounded-2xl overflow-hidden shadow-sm">
            <div 
              onClick={() => toast.success("Fitur Pusat Bantuan segera hadir!")}
              className="bg-white border-b border-ink-faint p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <QuestionCircle size={20} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">Pusat Bantuan</span>
              </div>
              <ChevronRight size={18} className="text-ink-faint group-hover:text-brand-500 transition-colors" />
            </div>
            <div 
              onClick={() => toast.success("Syarat & Ketentuan Rongsok.in")}
              className="bg-white p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <FileLines size={20} className="text-ink-muted group-hover:text-brand-500 transition-colors" />
                <span className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">Syarat & Ketentuan</span>
              </div>
              <ChevronRight size={18} className="text-ink-faint group-hover:text-brand-500 transition-colors" />
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleLogout} 
              className="w-full py-4 text-sm font-black text-status-error bg-white border border-status-error/20 rounded-xl shadow-sm hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer animate-pulse-subtle"
            >
              <ArrowRightToBracket size={18} /> Keluar Akun
            </button>
          </div>
        </section>
        
      </main>
      <BottomNav />
    </div>
  );
}
