"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff)) return "";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hr lalu`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userId = useAuthStore((s) => s.user?.id);
  const items = useNotificationStore((s) => s.items);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);

  const mine = useMemo(
    () => items.filter((n) => n.userId === userId),
    [items, userId]
  );
  const unread = mine.filter((n) => !n.read).length;

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && userId && unread > 0) markAllRead(userId);
  };

  const go = (id: string, href?: string) => {
    markRead(id);
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Notifikasi"
        className="text-mute hover:text-ink transition-colors relative p-2"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-status-error text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-surface-raised">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface-raised border border-ink-faint rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-faint">
            <h4 className="font-display font-extrabold text-sm text-ink">Notifikasi</h4>
            {mine.length > 0 && (
              <button
                onClick={() => userId && markAllRead(userId)}
                className="text-[11px] font-bold text-brand-700 hover:text-ink flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={13} /> Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {mine.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Inbox size={32} className="mx-auto text-ink-faint mb-2" />
                <p className="text-xs text-ink-muted">Belum ada notifikasi.</p>
              </div>
            ) : (
              mine.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n.id, n.href)}
                  className={`w-full text-left px-4 py-3 border-b border-ink-faint last:border-0 hover:bg-surface transition-colors ${
                    n.read ? "" : "bg-brand-100/40"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    )}
                    <div className={`min-w-0 ${n.read ? "pl-4" : ""}`}>
                      <p className="text-xs font-bold text-ink leading-snug">{n.title}</p>
                      <p className="text-[11px] text-ink-muted leading-snug mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-mute font-mono mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
