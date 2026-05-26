"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Share2, MapPin, Clock, Star, Phone, 
  MessageSquare, Archive, Wrench, RefreshCw, FileText, 
  Monitor, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";
import { useCollectorDetails, useWasteCategories } from "@/hooks/useDiscovery";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: RefreshCw,
  Logam: Wrench,
  Kertas: FileText,
  Elektronik: Monitor,
};

export default function PengepulDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("harga");

  const { data: collector, isLoading: isCollectorLoading, error } = useCollectorDetails(id);
  const { data: categories, isLoading: isCategoriesLoading } = useWasteCategories();

  if (isCollectorLoading || isCategoriesLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-24 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-10 h-10 text-brand-500 animate-spin" />
            <span className="text-sm font-bold text-ink-muted">Memuat detail lapak...</span>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !collector) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-between pb-24 md:pb-0">
        <DesktopNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-12 h-12 text-status-error animate-bounce" />
          <h3 className="font-bold text-ink">Mitra Pengepul Tidak Ditemukan</h3>
          <p className="text-xs text-ink-muted">API dari BE: ID Pengepul tidak valid atau data telah dihapus.</p>
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const partnerPhone = collector.user?.phone || "";
  const waNumber = partnerPhone.replace(/[^0-9]/g, "");
  const waLink = waNumber ? `https://wa.me/${waNumber.startsWith("0") ? "62" + waNumber.slice(1) : waNumber}` : "";

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan profil lapak disalin ke papan klip!");
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />
      
      {/* CONTENT WRAPPER */}
      <main className="flex-1 max-w-md mx-auto md:max-w-6xl w-full bg-white md:bg-transparent min-h-screen shadow-sm md:shadow-none border-x md:border-none border-ink-faint pb-6 md:pb-12 md:pt-6 md:px-8">
        
        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-3 flex items-center justify-between md:hidden">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-ink-muted hover:bg-surface-raised rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-extrabold text-sm uppercase tracking-widest text-ink">Detail Lapak</h1>
          <button onClick={handleShare} className="p-2 -mr-2 text-ink-muted hover:bg-surface-raised rounded-full transition-colors">
            <Share2 size={24} />
          </button>
        </header>

        {/* LAPAK PROFILE */}
        <section className="bg-white pb-6 md:rounded-2xl md:shadow-sm md:border md:border-ink-faint md:overflow-hidden relative">
          <div className="h-32 md:h-48 bg-gradient-to-r from-brand-500/20 to-brand-300/20 relative">
            <button onClick={handleShare} className="hidden md:flex absolute top-4 right-4 bg-white/80 backdrop-blur-sm hover:bg-white text-ink p-2.5 rounded-full shadow transition-all gap-1.5 items-center text-xs font-bold">
              <Share2 size={16} /> Bagikan Lapak
            </button>
            <div className="absolute -bottom-10 left-4 w-20 h-20 bg-white rounded-2xl shadow-md border-4 border-white flex items-center justify-center text-brand-500">
              <Archive size={32} />
            </div>
          </div>
          <div className="px-4 md:px-8 pt-16 pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-display font-extrabold text-ink flex items-center gap-2">
                  {collector.shopName} 
                  {collector.isPremium && (
                    <span className="text-[10px] font-black bg-brand-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                      Premium Partner
                    </span>
                  )}
                </h2>
                <p className="text-xs md:text-sm text-ink-muted max-w-xl font-body leading-relaxed">
                  {collector.description || "Mitra Pengepul Terpercaya Rongsok.in Yogyakarta."}
                </p>
              </div>
              
              {/* DESKTOP ACTION BUTTONS */}
              <div className="hidden md:flex gap-3">
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-brand-500 text-brand-600 font-bold px-6">
                      <MessageSquare size={18} className="mr-2" /> Chat WhatsApp
                    </Button>
                  </a>
                )}
                {partnerPhone && (
                  <a href={`tel:${partnerPhone}`}>
                    <Button className="font-bold px-6 shadow-md">
                      <Phone size={18} className="mr-2" /> Hubungi Telepon
                    </Button>
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex flex-col">
                <span className="text-xs text-ink-muted font-bold uppercase tracking-tight flex items-center gap-1"><Star size={12}/> Rating</span>
                <span className="font-extrabold text-sm text-ink font-mono mt-0.5">{collector.priorityScore || "4.8"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-ink-muted font-bold uppercase tracking-tight flex items-center gap-1"><Clock size={12}/> Status Lapak</span>
                <span className={`font-extrabold text-sm mt-0.5 ${collector.isOpen ? 'text-status-success' : 'text-status-error'}`}>
                  {collector.isOpen ? 'BUKA' : 'TUTUP'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-ink-muted font-bold uppercase tracking-tight flex items-center gap-1"><MapPin size={12}/> Jangkauan</span>
                <span className="font-extrabold text-sm text-ink font-mono mt-0.5">{collector.radiusKm} km</span>
              </div>
            </div>
          </div>
        </section>

        {/* TABS */}
        <section className="bg-white sticky top-[60px] z-40 md:static border-b border-ink-faint md:rounded-2xl md:mt-6 md:shadow-sm md:border">
          <div className="flex px-4 md:px-8 gap-6 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab("harga")}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'harga' ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-muted hover:text-ink'}`}
            >
              Daftar Harga
            </button>
            <button 
              onClick={() => setActiveTab("ulasan")}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ulasan' ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-muted hover:text-ink'}`}
            >
              Ulasan
            </button>
            <button 
              onClick={() => setActiveTab("info")}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-muted hover:text-ink'}`}
            >
              Informasi
            </button>
          </div>
        </section>

        {/* TAB CONTENT */}
        <main className="pt-6 px-1 md:px-0">
          {activeTab === "harga" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
              {categories?.map((cat) => {
                const IconComponent = categoryIcons[cat.name] || Sparkles;
                
                // Find matching active catalog in backend response
                const catalogItem = collector.catalogs?.find(
                  (c) => c.categoryId === cat.id && c.isActive
                );

                return (
                  <div 
                    key={cat.id} 
                    className="bg-white border border-ink-faint rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    <div className="w-14 h-14 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center shrink-0 border border-brand-100">
                      <IconComponent size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-12">
                      <h4 className="font-bold text-sm text-ink truncate">{cat.name}</h4>
                      {catalogItem ? (
                        <p className="text-brand-600 font-extrabold font-mono mt-1 text-sm md:text-base">
                          {formatRupiah(catalogItem.minPrice)} - {formatRupiah(catalogItem.maxPrice)} 
                          <span className="text-ink-muted font-normal text-[10px] font-sans ml-1">/kg</span>
                        </p>
                      ) : (
                        <p className="text-status-error text-[10px] font-extrabold tracking-tight mt-1 leading-tight flex items-start gap-1">
                          <AlertCircle size={12} className="shrink-0 mt-0.5" />
                          <span>API dari BE: Harga {cat.name} belum diatur oleh Pengepul.</span>
                        </p>
                      )}
                    </div>
                    
                    {catalogItem && (
                      <Link href={`/orders/new?category=${cat.id}`} className="absolute right-4">
                        <Button variant="outline" className="px-3.5 py-1.5 h-auto text-[10px] font-extrabold text-brand-600 border-brand-200 bg-brand-50 hover:bg-brand-100">
                          JUAL
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "ulasan" && (
            <div className="text-center py-16 bg-white border border-ink-faint rounded-2xl shadow-sm animate-in fade-in">
              <MessageSquare size={44} className="mx-auto text-ink-faint mb-3 animate-pulse-subtle" />
              <h4 className="font-bold text-ink">Ulasan Pengepul</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">API dari BE: Belum ada ulasan untuk lapak ini di database.</p>
            </div>
          )}

          {activeTab === "info" && (
            <div className="bg-white border border-ink-faint rounded-2xl p-6 shadow-sm animate-in fade-in space-y-6">
              <div>
                <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest mb-3">Informasi Lapak</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-surface-raised p-4 rounded-xl border border-ink-faint space-y-1">
                    <span className="text-ink-muted font-bold uppercase tracking-wider text-[9px] block">Pemilik Lapak</span>
                    <span className="font-extrabold text-ink text-sm">{collector.user?.name || "Mitra Pengepul"}</span>
                  </div>
                  <div className="bg-surface-raised p-4 rounded-xl border border-ink-faint space-y-1">
                    <span className="text-ink-muted font-bold uppercase tracking-wider text-[9px] block">Radius Layanan</span>
                    <span className="font-extrabold text-ink text-sm">{collector.radiusKm} Kilometer</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-ink-faint pt-4">
                <h4 className="font-display font-extrabold text-xs text-ink-muted uppercase tracking-widest mb-2">Pemberitahuan Geolocation</h4>
                <p className="text-xs text-ink-muted leading-relaxed font-body">
                  API dari BE: Detail alamat lengkap dan lokasi presisi lapak di peta akan dibagikan secara otomatis kepada Anda setelah transaksi berhasil dibuat demi menjaga privasi mitra.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* STICKY ACTION BAR (MOBILE ONLY) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none md:hidden">
          <div className="max-w-md mx-auto bg-white border-t border-ink-faint p-4 flex gap-3 pointer-events-auto border-x shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 block">
                <Button variant="outline" className="w-full py-4 text-brand-600 border-brand-500 font-bold gap-2">
                  <MessageSquare size={20} /> Chat WA
                </Button>
              </a>
            )}
            {partnerPhone && (
              <a href={`tel:${partnerPhone}`} className="flex-[2] block">
                <Button className="w-full py-4 shadow-lg shadow-brand-500/30 font-bold gap-2">
                  <Phone size={20} /> Hubungi Telepon
                </Button>
              </a>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
