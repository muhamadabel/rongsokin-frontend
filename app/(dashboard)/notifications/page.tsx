"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Trash2, ChevronRight } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import DesktopNav from "@/components/ui/DesktopNav";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hr lalu`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const remove = useNotificationStore((s) => s.remove);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const mine = useMemo(
    () => items.filter((n) => n.userId === userId),
    [items, userId]
  );

  const open = (id: string, href?: string) => {
    markRead(id);
    if (href) router.push(href);
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8 flex flex-col">
      <DesktopNav />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-0 py-5 md:py-8 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="font-display font-extrabold text-xl text-ink flex items-center gap-2">
            <Bell size={22} className="text-brand-700" /> Notifikasi
          </h1>
          {mine.length > 0 && (
            <button
              onClick={() => userId && markAllRead(userId)}
              className="text-xs font-bold text-brand-700 hover:text-ink flex items-center gap-1 transition-colors"
            >
              <CheckCheck size={15} /> Tandai semua dibaca
            </button>
          )}
        </header>

        {mine.length === 0 ? (
          <div className="bg-surface-raised rounded-2xl text-center py-16 px-6">
            <Inbox size={40} className="mx-auto text-ink-faint mb-3" />
            <p className="font-bold text-sm text-ink">Belum ada notifikasi</p>
            <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto leading-relaxed">
              Update pesanan & info penting akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {mine.map((n) => (
              <div
                key={n.id}
                className={`bg-surface-raised rounded-2xl p-4 flex items-start gap-3 ${
                  n.read ? "" : "ring-1 ring-brand-200"
                }`}
              >
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                )}
                <button
                  onClick={() => open(n.id, n.href)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-bold text-ink leading-snug">{n.title}</p>
                  <p className="text-xs text-ink-muted leading-snug mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-mute font-mono mt-1.5">
                    {timeAgo(n.createdAt)}
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {n.href && (
                    <button
                      onClick={() => open(n.id, n.href)}
                      className="p-1.5 text-ink-faint hover:text-ink transition-colors"
                      aria-label="Buka"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="p-1.5 text-ink-faint hover:text-status-error transition-colors"
                    aria-label="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
