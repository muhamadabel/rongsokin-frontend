"use client";

import { useState, useEffect, Suspense } from "react";
import { Search, MapPin, Archive, Star } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { Input } from "@/components/ui/Input";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import Link from "next/link";
import { useSearchCollectors, useCategoryTree } from "@/hooks/useDiscovery";
import { useUserCoords } from "@/hooks/useUserCoords";
import { useAuthStore } from "@/store/authStore";
import { formatDistance } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Lokasi pencarian: lokasi tersimpan customer > GPS > default Yogyakarta
  const { coords, ready: coordsReady } = useUserCoords();
  const [selectedMainId, setSelectedMainId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { mains } = useCategoryTree();

  // Default ke induk pertama; atau dari ?category= (nama induk dari landing)
  useEffect(() => {
    if (mains.length === 0) return;
    const param = searchParams.get("category");
    const byName = param
      ? mains.find((m) => m.name.toLowerCase() === param.toLowerCase())
      : null;
    setSelectedMainId((prev) => prev || byName?.id || mains[0].id);
  }, [mains, searchParams]);

  const selectedMain = mains.find((m) => m.id === selectedMainId);
  const { data: collectors, isLoading } = useSearchCollectors(
    {
      lat: coords.lat,
      lng: coords.lng,
      categoryId: selectedMainId || undefined,
      radius: 50,
    },
    { enabled: coordsReady }
  );

  const filteredCollectors =
    collectors?.filter(
      (c) =>
        c.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />

      {/* MOBILE SEARCH HEADER */}
      <header className="sticky top-0 z-50 bg-surface-raised border-b border-ink-faint px-4 py-3 flex gap-3 md:hidden">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Cari nama lapak…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-5 md:py-8 max-w-6xl w-full mx-auto space-y-6">
        <h1 className="hidden md:block font-display text-3xl font-extrabold tracking-tight text-ink">
          Cari pengepul
        </h1>

        {/* DESKTOP SEARCH */}
        <section className="hidden md:block">
          <div className="relative max-w-xl">
            <Input
              type="text"
              placeholder="Cari nama lapak…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" />
          </div>
        </section>

        {/* CATEGORY PILLS */}
        <section className="space-y-2.5">
          <h4 className="text-[11px] font-bold text-mute uppercase tracking-widest font-mono">
            Pilih Kategori Sampah
          </h4>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 py-1">
            {mains.map((cat) => {
              const isActive = selectedMainId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedMainId(cat.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "bg-brand-500 text-ink border-brand-500"
                      : "bg-surface-raised text-ink-muted border-ink-faint hover:border-ink"
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
          <h3 className="font-display font-extrabold text-base text-ink tracking-tight">
            Mitra Pengepul{selectedMain ? ` (${selectedMain.name})` : ""}
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-raised rounded-2xl p-5 h-28 animate-pulse" />
              ))}
            </div>
          ) : filteredCollectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollectors.map((collector) => (
                <Link
                  key={collector.id}
                  href={`/pengepul/${collector.id}`}
                  className="block bg-surface-raised p-5 rounded-2xl hover:bg-brand-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-surface group-hover:bg-brand-500 text-ink rounded-2xl flex items-center justify-center shrink-0 transition-colors">
                      <Archive size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-ink truncate">
                          {collector.shopName}
                        </h4>
                        {collector.isVerified && <VerifiedBadge size="xs" className="mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
                        <MapPin size={12} className="text-brand-700 shrink-0" />
                        <span className="font-mono">
                          {collector.distance != null
                            ? formatDistance(collector.distance)
                            : "Dekat"}{" "}
                          dari lokasimu
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-3 text-[11px] font-bold text-ink-muted border-t border-dashed border-ink-faint pt-2.5">
                        <span className="flex items-center gap-0.5">
                          <Star size={12} className="fill-status-warning text-status-warning" />
                          <span className="font-mono">
                            {collector.avgRating > 0 ? collector.avgRating.toFixed(1) : "Baru"}
                          </span>
                        </span>
                        <span className="text-ink-faint">•</span>
                        <span className="text-status-success font-bold">Terima Jemput</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface-raised rounded-2xl p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">
                <Search size={28} className="text-ink-faint" />
              </div>
              <h4 className="font-bold text-ink">Tidak ada pengepul ditemukan</h4>
              <p className="text-xs text-ink-muted mt-1.5 max-w-xs leading-relaxed">
                Mitra untuk kategori{selectedMain ? ` "${selectedMain.name}"` : ""} kosong dalam
                radius pencarianmu.
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
