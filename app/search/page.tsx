"use client";

import { useState, useEffect } from "react";
import { Search, MapPinAlt, Archive, Star, Refresh, Tools, FileLines, DesktopPc } from "flowbite-react-icons/outline";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useSearchCollectors, useWasteCategories } from "@/hooks/useDiscovery";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_COORDS, formatDistance } from "@/lib/utils";

import { useRouter } from "next/navigation";

const categoryIcons: Record<string, any> = {
  Kardus: Archive,
  Plastik: Refresh,
  Logam: Tools,
  Kertas: FileLines,
  Elektronik: DesktopPc,
};

export default function SearchPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (token && user?.role === "COLLECTOR") {
      router.replace("/collector");
    }
  }, [token, user, router]);

  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Kardus");
  const [searchQuery, setSearchQuery] = useState("");

  // Get user location
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          console.log("Using default Yogyakarta coordinates");
        }
      );
    }
  }, []);

  const { data: categories } = useWasteCategories();
  const { data: collectors, isLoading } = useSearchCollectors({
    lat: coords.lat,
    lng: coords.lng,
    category: selectedCategoryName,
    radius: 50,
  });

  // Filter collectors by query if typed
  const filteredCollectors = collectors?.filter((c) => 
    c.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />
      
      {/* MOBILE SEARCH HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-ink-faint px-4 py-4 flex gap-3 shadow-sm md:hidden">
        <div className="flex-1 relative">
          <Input 
            type="text" 
            placeholder="Cari nama lapak..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-surface-raised border-none" 
          />
          <Search className="w-5 h-5 absolute left-4 top-3 text-ink-muted" />
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-4 md:py-8 max-w-6xl w-full mx-auto space-y-6">
        
        {/* DESKTOP SEARCH & FILTER */}
        <section className="hidden md:flex gap-4 items-center bg-white p-4 rounded-2xl border border-ink-faint shadow-sm">
          <div className="flex-1 relative">
            <Input 
              type="text" 
              placeholder="Cari nama lapak..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-surface-raised" 
            />
            <Search className="w-5 h-5 absolute left-3 top-3 text-ink-muted" />
          </div>
        </section>

        {/* CATEGORY SELECTOR PILLS */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-bold text-ink-muted uppercase tracking-widest block font-display">Pilih Kategori Sampah</h4>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 py-1">
            {categories?.map((cat) => {
              const isActive = selectedCategoryName.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryName(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isActive 
                      ? "bg-brand-500 text-white border-brand-500 shadow-md scale-105" 
                      : "bg-white text-ink-muted border-ink-faint hover:bg-brand-50 hover:text-brand-600"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* COLLECTORS LIST */}
        <section className="space-y-4">
          <h3 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">
            Mitra Pengepul Terdekat ({selectedCategoryName})
          </h3>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Refresh className="w-8 h-8 text-brand-500 animate-spin" />
              <span className="text-xs font-bold text-ink-muted">Mencari pengepul di sekitarmu...</span>
            </div>
          ) : filteredCollectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollectors.map((collector) => (
                <Link 
                  key={collector.id} 
                  href={`/pengepul/${collector.id}`} 
                  className="block bg-white border border-ink-faint p-4 rounded-xl shadow-sm hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center shrink-0 border border-brand-100">
                      <Archive size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-ink group-hover:text-brand-600 transition-colors truncate">
                          {collector.shopName}
                        </h4>
                        <span className="text-[9px] font-black bg-brand-500 text-white border border-brand-500 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-1 flex items-center gap-1">
                        <MapPinAlt size={12} className="text-brand-500 shrink-0" />
                        <span className="font-mono">
                          {collector.distance ? formatDistance(collector.distance) : "Dekat"} dari lokasimu
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-ink-muted border-t border-dashed border-ink-faint pt-2.5">
                        <span className="flex items-center gap-0.5 text-status-warning">
                          <Star size={12} className="fill-status-warning"/> 
                          {collector.priorityScore || "4.8"}
                        </span>
                        <span>•</span>
                        <span className="text-status-success font-bold">🟢 Terima Jemput</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-ink-faint border-dashed rounded-2xl p-12 flex flex-col items-center text-center shadow-sm">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 border border-ink-faint shadow-inner">
                <Search size={32} className="text-ink-faint" />
              </div>
              <h4 className="font-bold text-ink">Tidak ada pengepul ditemukan</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs leading-relaxed">
                API dari BE: Mitra terdekat terdaftar untuk kategori &quot;{selectedCategoryName}&quot; saat ini kosong dalam radius 10km.
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
