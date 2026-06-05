import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";

/** Blok pulse dasar. Pakai untuk semua placeholder. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/[0.06] rounded-lg ${className}`} />;
}

/** Kartu putih statis yang isinya placeholder. */
function Card({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`bg-surface-raised rounded-2xl ${className}`}>{children}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <DesktopNav />
      {children}
      <BottomNav />
    </div>
  );
}

// ── Dashboard (customer) ─────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <Shell>
      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-5 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>

        {/* 3 stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="w-8 h-8 rounded-2xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </Card>
          ))}
        </div>

        {/* category row */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-44" />
          <div className="flex gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 min-w-[88px] flex flex-col items-center gap-2">
                <Skeleton className="w-11 h-11 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </Card>
            ))}
          </div>
        </div>

        {/* nearby + history */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4 flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </Shell>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <Shell>
      <main className="max-w-2xl w-full mx-auto px-4 md:px-0 py-5 md:py-8 space-y-5">
        <Card className="p-6 flex flex-col items-center gap-3">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
          <div className="mt-3 w-full max-w-sm grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </Card>
        {[0, 1].map((g) => (
          <Card key={g} className="overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4 border-b border-ink-faint last:border-0">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </Card>
        ))}
      </main>
    </Shell>
  );
}

// ── Profile Edit ─────────────────────────────────────────────────────────
export function ProfileEditSkeleton() {
  return (
    <Shell>
      <main className="max-w-2xl mx-auto px-4 md:px-0 py-5 md:py-8 space-y-5">
        <Card className="p-6 flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
        {[0, 1].map((s) => (
          <Card key={s} className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ))}
          </Card>
        ))}
      </main>
    </Shell>
  );
}

// ── Order detail / tracking ──────────────────────────────────────────────
export function OrderDetailSkeleton() {
  return (
    <Shell>
      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        <Card className="p-6">
          <Skeleton className="h-3 w-32 mb-6" />
          <div className="flex justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-2 w-10" />
              </div>
            ))}
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </Card>
          </div>
          <Card className="p-6 space-y-3 h-fit">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </Card>
        </div>
      </main>
    </Shell>
  );
}

// ── Collector dashboard ──────────────────────────────────────────────────
export function CollectorSkeleton() {
  return (
    <Shell>
      <main className="max-w-6xl w-full mx-auto px-4 md:px-8 py-5 md:py-8 space-y-6">
        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="w-16 h-8 rounded-full" />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-4">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </Card>
          <Card className="p-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5 h-36" />
          ))}
        </div>
      </main>
    </Shell>
  );
}

// ── Pengepul detail (public) ─────────────────────────────────────────────
export function PengepulDetailSkeleton() {
  return (
    <Shell>
      <main className="max-w-3xl w-full mx-auto md:px-8 md:pt-6">
        <Card className="overflow-hidden">
          <Skeleton className="h-28 md:h-40 w-full rounded-none" />
          <div className="px-4 md:px-6 pt-12 pb-5 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-2/3" />
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          </div>
        </Card>
        <Card className="mt-4 p-4 md:p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </Card>
      </main>
    </Shell>
  );
}

// ── Generic (route guard / suspense) ─────────────────────────────────────
export function PageSkeleton() {
  return (
    <Shell>
      <main className="max-w-3xl w-full mx-auto px-4 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </main>
    </Shell>
  );
}
