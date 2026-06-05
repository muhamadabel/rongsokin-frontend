"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BarChart2,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
  X,
  AlertTriangle,
  Search,
  Filter,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";
import { useCategoryTree } from "@/hooks/useDiscovery";
import {
  useAdminStats,
  useAdminOrders,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useAdmin";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Order, OrderStatus, WasteCategory } from "@/types";
import toast from "react-hot-toast";

const ORDER_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "PENDING" },
  { label: "Diterima", value: "CONFIRMED" },
  { label: "Berjalan", value: "IN_PROGRESS" },
  { label: "Konfirmasi", value: "AWAITING_CONFIRMATION" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Batal", value: "CANCELLED" },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-[#fff4cc] text-[#4a3b1c]",
  CONFIRMED: "bg-brand-100 text-brand-800",
  IN_PROGRESS: "bg-[#dbeeff] text-[#0b4a6b]",
  AWAITING_CONFIRMATION: "bg-[#ecdcff] text-[#3b1c5a]",
  COMPLETED: "bg-brand-100 text-brand-800",
  CANCELLED: "bg-status-error/10 text-status-error",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Diterima",
  IN_PROGRESS: "Berjalan",
  AWAITING_CONFIRMATION: "Konfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
};

export default function AdminDashboard() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    if (token && user && user.role !== "ADMIN") {
      router.replace(user.role === "COLLECTOR" ? "/collector" : "/dashboard");
    }
  }, [token, user, router]);

  const stats = useAdminStats();
  const isMocked = (stats.data as { _mocked?: boolean } | undefined)?._mocked;

  const handleLogout = () => {
    logout();
    toast.success("Berhasil keluar dari sesi admin.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col font-body">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-5 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h1 className="font-display font-extrabold text-base md:text-lg tracking-tight text-ink flex items-center gap-2">
              Rongsok.in Admin
              <span className="bg-brand-100 text-brand-800 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
                Console
              </span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-mute uppercase tracking-widest -mt-0.5">
              Management Panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-mute hidden md:block">
            Sesi: <span className="text-ink">{user?.name || "Administrator"}</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-ink-muted hover:text-status-error border border-ink-faint rounded-2xl hover:border-status-error transition-all cursor-pointer"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-6xl w-full mx-auto space-y-8">
        {isMocked && (
          <div className="bg-[#fff4cc] rounded-2xl px-4 py-3 flex items-center gap-2.5 text-[#4a3b1c]">
            <ShieldCheck size={16} className="shrink-0" />
            <span className="text-xs font-semibold">Mode preview — data dummy sampai endpoint BE siap.</span>
          </div>
        )}

        <StatsSection />
        <CategoryManager />
        <OrderMonitoring />
      </main>
    </div>
  );
}

// ── STATS ────────────────────────────────────────────────────────────────
function StatsSection() {
  const { data, isLoading, refetch, isFetching } = useAdminStats();

  if (isLoading) {
    return (
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-raised rounded-2xl h-32 animate-pulse" />
        ))}
      </section>
    );
  }

  if (!data) return null;

  const totalUsers = data.totalCustomers + data.totalCollectors;
  const kpis = [
    { title: "Total Tonase", val: `${(data.totalWeightKg / 1000).toFixed(2)} Ton`, icon: Archive },
    { title: "Total Payout", val: formatRupiah(data.totalPayout), icon: ArrowDownRight },
    { title: "Transaksi Aktif", val: `${data.activeOrders}`, icon: Scale },
    { title: "Pengguna", val: `${totalUsers}`, icon: Users },
  ];

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-surface-raised p-5 rounded-2xl flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-mute uppercase tracking-widest font-mono">
                {kpi.title}
              </span>
              <div className="w-8 h-8 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-800">
                <kpi.icon size={16} />
              </div>
            </div>
            <h3 className="font-display font-extrabold text-xl md:text-2xl text-ink tracking-tight font-mono">
              {kpi.val}
            </h3>
          </div>
        ))}
      </section>

      {/* CHART */}
      <section className="bg-surface-raised p-6 rounded-2xl space-y-6">
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
            <BarChart2 className="text-brand-700" size={18} />
            Setoran Mingguan
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-800 bg-brand-100 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={12} />
              {(() => {
                const w = data.weeklyTransactions;
                if (w.length < 2) return "0%";
                const first = w[0].weight || 1;
                const last = w[w.length - 1].weight;
                const diff = ((last - first) / first) * 100;
                return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
              })()}
            </span>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-8 h-8 rounded-2xl border border-ink-faint hover:border-ink flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <WeeklyBarChart points={data.weeklyTransactions} />
      </section>
    </>
  );
}

function WeeklyBarChart({
  points,
}: {
  points: { day: string; weight: number; amount: number; count: number }[];
}) {
  const max = Math.max(...points.map((p) => p.weight), 1);
  return (
    <div className="h-56 flex items-end justify-between gap-2.5 pt-4 border-b border-ink-faint">
      {points.map((item) => {
        const pct = (item.weight / max) * 100;
        return (
          <div key={item.day} className="flex-1 flex flex-col items-center group h-full justify-end relative">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-ink rounded-xl px-2 py-1 text-[10px] font-mono opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
              <div className="text-brand-500 font-bold">{item.weight} kg</div>
              <div className="text-forest-ink">{formatRupiah(item.amount)}</div>
              <div className="text-forest-muted">{item.count} order</div>
            </div>
            <div
              style={{ height: `${pct}%` }}
              className="w-full bg-brand-500 group-hover:bg-brand-600 rounded-t-lg transition-all min-h-[4px]"
            />
            <span className="text-[10px] font-bold text-mute mt-2 block">{item.day.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── CATEGORY MANAGER (hierarkis: induk → item) ───────────────────────────
function CategoryManager() {
  const { mains, childrenOf, isLoading } = useCategoryTree();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [newMainName, setNewMainName] = useState("");
  const [addingToMain, setAddingToMain] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [subUnit, setSubUnit] = useState<"kg" | "liter" | "pcs">("kg");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<WasteCategory | null>(null);

  const handleAddMain = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMainName.trim();
    if (name.length < 2) {
      toast.error("Nama kategori minimal 2 karakter.");
      return;
    }
    createCat.mutate(
      { name, parentId: null, sortOrder: mains.length },
      {
        onSuccess: () => {
          toast.success(`Kategori utama "${name}" ditambahkan.`);
          setNewMainName("");
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e?.response?.data?.message || "Gagal menambah kategori.");
        },
      }
    );
  };

  const handleAddSub = (mainId: string) => {
    const name = subName.trim();
    if (name.length < 2) {
      toast.error("Nama item minimal 2 karakter.");
      return;
    }
    createCat.mutate(
      { name, parentId: mainId, unit: subUnit, sortOrder: (childrenOf[mainId]?.length ?? 0) },
      {
        onSuccess: () => {
          toast.success(`Item "${name}" ditambahkan.`);
          setSubName("");
          setSubUnit("kg");
          setAddingToMain(null);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e?.response?.data?.message || "Gagal menambah item.");
        },
      }
    );
  };

  const startEdit = (cat: WasteCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = (id: string) => {
    const name = editName.trim();
    if (name.length < 2) {
      toast.error("Nama kategori minimal 2 karakter.");
      return;
    }
    updateCat.mutate(
      { id, payload: { name } },
      {
        onSuccess: () => {
          toast.success("Kategori diperbarui.");
          setEditingId(null);
        },
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e?.response?.data?.message || "Gagal mengubah kategori.");
        },
      }
    );
  };

  const handleDelete = (cat: WasteCategory) => {
    deleteCat.mutate(cat.id, {
      onSuccess: () => {
        toast.success(`Kategori "${cat.name}" dihapus.`);
        setConfirmDelete(null);
      },
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e?.response?.data?.message || "Gagal menghapus kategori.");
      },
    });
  };

  const editRow = (cat: WasteCategory) =>
    editingId === cat.id ? (
      <div className="flex gap-1.5 items-center">
        <Input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
          className="text-xs h-8 py-1 flex-1"
        />
        <button
          onClick={() => saveEdit(cat.id)}
          disabled={updateCat.isPending}
          className="h-8 px-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-2xl text-ink text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Check size={12} />
        </button>
        <button
          onClick={() => setEditingId(null)}
          className="h-8 px-2 border border-ink-faint hover:bg-surface rounded-2xl text-ink-muted shrink-0"
        >
          <X size={12} />
        </button>
      </div>
    ) : null;

  return (
    <section className="bg-surface-raised p-6 rounded-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
          <Archive className="text-brand-700" size={18} />
          Kategori Sampah
        </h3>

        <form onSubmit={handleAddMain} className="flex gap-2 shrink-0">
          <Input
            type="text"
            placeholder="Kategori utama baru…"
            value={newMainName}
            onChange={(e) => setNewMainName(e.target.value)}
            className="h-11 w-48 py-2"
          />
          <Button type="submit" disabled={createCat.isPending} className="px-4 py-2 flex items-center gap-1">
            <Plus size={16} /> {createCat.isPending ? "…" : "Induk"}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : mains.length > 0 ? (
        <div className="space-y-3">
          {mains.map((main) => {
            const subs = childrenOf[main.id] || [];
            return (
              <div key={main.id} className="bg-surface rounded-2xl p-4 space-y-3">
                {/* Header induk */}
                <div className="flex items-center justify-between gap-2">
                  {editingId === main.id ? (
                    <div className="flex-1">{editRow(main)}</div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-display font-extrabold text-sm text-ink truncate">
                          {main.name}
                        </h4>
                        <span className="text-[10px] text-mute font-mono shrink-0">
                          {subs.length} item
                        </span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(main)}
                          className="h-7 px-2 border border-ink-faint hover:border-ink rounded-2xl text-ink-muted hover:text-ink text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(main)}
                          className="h-7 px-2 border border-ink-faint hover:border-status-error rounded-2xl text-ink-muted hover:text-status-error cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Sub-item chips */}
                <div className="flex flex-wrap gap-2">
                  {subs.map((sub) =>
                    editingId === sub.id ? (
                      <div key={sub.id} className="w-full">{editRow(sub)}</div>
                    ) : (
                      <span
                        key={sub.id}
                        className="bg-surface-raised rounded-2xl pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 text-xs"
                      >
                        <span className="font-bold text-ink">{sub.name}</span>
                        <span className="text-[9px] text-mute font-mono uppercase">{sub.unit || "kg"}</span>
                        <button
                          onClick={() => startEdit(sub)}
                          className="text-ink-faint hover:text-ink ml-1"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(sub)}
                          className="text-ink-faint hover:text-status-error"
                        >
                          <Trash2 size={11} />
                        </button>
                      </span>
                    )
                  )}

                  {/* Tambah item */}
                  {addingToMain === main.id ? (
                    <div className="w-full flex gap-1.5 items-center mt-1">
                      <Input
                        type="text"
                        placeholder="Nama item…"
                        value={subName}
                        onChange={(e) => setSubName(e.target.value)}
                        autoFocus
                        className="text-xs h-8 py-1 flex-1"
                      />
                      <select
                        value={subUnit}
                        onChange={(e) => setSubUnit(e.target.value as "kg" | "liter" | "pcs")}
                        className="h-8 rounded-md border border-ink bg-surface-raised text-xs font-bold px-2"
                      >
                        <option value="kg">kg</option>
                        <option value="liter">liter</option>
                        <option value="pcs">pcs</option>
                      </select>
                      <button
                        onClick={() => handleAddSub(main.id)}
                        disabled={createCat.isPending}
                        className="h-8 px-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-2xl text-ink text-[11px] font-bold cursor-pointer shrink-0"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setAddingToMain(null)}
                        className="h-8 px-2 border border-ink-faint hover:bg-surface rounded-2xl text-ink-muted shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingToMain(main.id);
                        setSubName("");
                        setSubUnit("kg");
                      }}
                      className="rounded-2xl border border-dashed border-ink-faint hover:border-ink px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-10 flex flex-col items-center text-center">
          <Archive size={28} className="text-ink-faint mb-2" />
          <p className="text-xs font-bold text-ink">Belum ada kategori</p>
          <p className="text-[11px] text-mute mt-1 max-w-xs">
            Tambahkan kategori utama dulu, lalu isi item di dalamnya.
          </p>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          category={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
          isPending={deleteCat.isPending}
        />
      )}
    </section>
  );
}

function ConfirmDeleteModal({
  category,
  onCancel,
  onConfirm,
  isPending,
}: {
  category: WasteCategory;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-raised rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-status-error/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-status-error" />
          </div>
          <div className="flex-1">
            <h4 className="font-display font-extrabold text-base text-ink">Hapus kategori?</h4>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Kategori <span className="text-ink font-bold">&quot;{category.name}&quot;</span> akan
              dihapus dari data master. Katalog pengepul yang merujuk ke kategori ini bisa jadi
              tidak valid. Tindakan ini tidak bisa dibatalkan.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 text-xs">
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-[2] text-xs flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} /> {isPending ? "Menghapus…" : "Hapus Kategori"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── ORDER MONITORING ─────────────────────────────────────────────────────
function OrderMonitoring() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 10;

  const { data, isLoading, isFetching, refetch } = useAdminOrders({
    status: statusFilter || undefined,
    page,
    limit,
  });

  const filteredData = useMemo(() => {
    const list = data?.data || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customer?.name?.toLowerCase().includes(q) ||
        o.collector?.name?.toLowerCase().includes(q) ||
        o.category?.name?.toLowerCase().includes(q)
    );
  }, [data, searchTerm]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <section className="bg-surface-raised p-6 rounded-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="font-display font-extrabold text-base text-ink tracking-tight flex items-center gap-2">
          <Eye className="text-brand-700" size={18} />
          Monitoring Transaksi
        </h3>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <Input
              type="text"
              placeholder="Cari ID / nama / kategori…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-8 w-56 py-2"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-11 h-11 rounded-2xl border border-ink-faint hover:border-ink flex items-center justify-center text-ink-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
        <Filter size={14} className="text-mute shrink-0" />
        {ORDER_STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.label}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                active
                  ? "bg-brand-500 text-ink border-brand-500"
                  : "bg-surface text-ink-muted border-ink-faint hover:border-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="border border-ink-faint rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface border-b border-ink-faint">
              <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-mute">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Pengepul</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Berat</th>
                <th className="px-4 py-3 text-right">Nominal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-ink-faint">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 bg-surface rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((order) => <OrderRow key={order.id} order={order} />)
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Eye size={24} className="text-ink-faint" />
                      <p className="text-sm font-bold text-ink">
                        {searchTerm
                          ? "Tidak ada transaksi cocok"
                          : statusFilter
                          ? "Tidak ada transaksi pada filter ini"
                          : "Belum ada transaksi tercatat"}
                      </p>
                      <p className="text-[11px] text-mute">Data akan muncul saat ada order masuk.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[11px] text-mute font-mono">
            Halaman <span className="text-ink font-bold">{page}</span> dari{" "}
            <span className="text-ink font-bold">{totalPages}</span> · Total{" "}
            <span className="text-ink font-bold">{data.total}</span> transaksi
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-9 px-3 border border-ink-faint rounded-2xl text-xs font-bold text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed hover:border-ink flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-9 px-3 border border-ink-faint rounded-2xl text-xs font-bold text-ink-muted disabled:opacity-40 disabled:cursor-not-allowed hover:border-ink flex items-center gap-1 cursor-pointer"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function OrderRow({ order }: { order: Order }) {
  const total = order.totalPrice ?? (order.actualWeight ?? 0) * (order.agreedPrice ?? 0);
  const weight = order.actualWeight ?? order.estimatedWeight;
  return (
    <tr className="border-b border-ink-faint hover:bg-surface transition-colors">
      <td className="px-4 py-3 font-mono text-[11px] text-brand-800">#{order.id.slice(0, 8)}</td>
      <td className="px-4 py-3 text-ink">
        {order.customer?.name || <span className="text-mute">—</span>}
      </td>
      <td className="px-4 py-3 text-ink">
        {order.collector?.name || <span className="text-mute">—</span>}
      </td>
      <td className="px-4 py-3 text-ink-muted">{order.category?.name || "—"}</td>
      <td className="px-4 py-3 text-right font-mono text-ink">{weight} kg</td>
      <td className="px-4 py-3 text-right font-mono text-ink font-bold">
        {total > 0 ? formatRupiah(total) : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase ${STATUS_BADGE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-[10px] text-mute font-mono whitespace-nowrap">
        {formatDate(order.createdAt)}
      </td>
    </tr>
  );
}
