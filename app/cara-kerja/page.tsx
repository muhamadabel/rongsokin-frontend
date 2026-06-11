import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UserCheck,
  PackagePlus,
  Truck,
  Navigation,
  Scale,
  Wallet,
  Star,
  Leaf,
  Trophy,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Recycle,
} from "lucide-react";
import DesktopNav from "@/components/ui/DesktopNav";
import BottomNav from "@/components/ui/BottomNav";

const steps = [
  {
    icon: UserCheck,
    title: "Daftar & Verifikasi",
    desc: "Buat akun lalu verifikasi identitas lewat KTP. 1 KTP = 1 akun untuk mencegah penyalahgunaan.",
  },
  {
    icon: PackagePlus,
    title: "Buat Pesanan",
    desc: "Pilih kategori sampah, foto langsung dari kamera (anti pesanan fiktif), dan tandai lokasimu di peta.",
  },
  {
    icon: Truck,
    title: "Pilih Metode",
    desc: "Antar sendiri (drop-off) atau minta dijemput (pick-up). Transaksi pertama wajib antar sendiri demi keamanan bersama.",
  },
  {
    icon: Navigation,
    title: "Pengepul & Live Tracking",
    desc: "Pengepul terdekat menerima pesanan. Saat menuju lokasi, posisinya dilacak real-time di peta — koordinasi mudah lewat WhatsApp.",
  },
  {
    icon: Scale,
    title: "Timbang & Sepakati Harga",
    desc: "Sampah ditimbang, harga per kategori transparan. Kategori yang tidak laku bisa ditandai 'tidak diterima' tanpa membatalkan yang lain.",
  },
  {
    icon: Wallet,
    title: "Setujui & Dibayar",
    desc: "Kamu menyetujui hasil timbangan, pembayaran tunai/transfer langsung di tempat (COD). Struk digital otomatis terbit.",
  },
  {
    icon: Star,
    title: "Beri Rating",
    desc: "Nilai pengalamanmu. Rating membangun ekosistem pengepul yang terpercaya untuk semua.",
  },
];

const benefits = [
  {
    icon: Wallet,
    title: "Cuan dari Sampah",
    desc: "Harga transparan per kategori, uang langsung cair saat transaksi.",
  },
  {
    icon: Leaf,
    title: "Dampak Ekologis",
    desc: "Setiap kilogram dihitung jadi pengurangan emisi karbon — bukan sekadar buang sampah.",
  },
  {
    icon: Trophy,
    title: "Papan Peringkat",
    desc: "Naik tier dari Pemula Hijau sampai Legenda Bumi & bersaing jadi Pahlawan Lingkungan.",
  },
  {
    icon: MapPin,
    title: "Pengepul Terdekat",
    desc: "Berbasis geolokasi — temukan lapak terdekat di sekitarmu secara otomatis.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terverifikasi",
    desc: "Verifikasi KTP + foto kamera-only. Minim penipuan & pesanan fiktif.",
  },
  {
    icon: MessageSquare,
    title: "Tanpa Ribet",
    desc: "Pembayaran COD, koordinasi langsung via WhatsApp. Tanpa biaya tersembunyi.",
  },
];

export default function CaraKerjaPage() {
  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <DesktopNav />

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 bg-surface-raised border-b border-ink-faint px-4 py-3 flex items-center gap-3 md:hidden">
        <Link
          href="/profile"
          className="p-2 -ml-2 text-ink-muted hover:bg-surface rounded-full transition-colors"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">Cara Kerja</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-0 py-5 md:py-8 space-y-8">
        {/* HERO */}
        <section className="bg-ink rounded-2xl p-6 text-forest-ink relative overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-44 h-44 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(159,232,112,0.2), transparent 70%)" }}
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-brand-500/15 text-brand-500 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider">
              <Recycle size={13} /> Marketplace Daur Ulang
            </span>
            <h2 className="font-display font-black text-2xl text-forest-ink tracking-tight mt-3 leading-tight">
              Ubah sampahmu jadi cuan — mudah, transparan, berdampak.
            </h2>
            <p className="text-sm text-forest-muted mt-2 leading-relaxed">
              Rongsok.in menghubungkanmu dengan pengepul terdekat di Yogyakarta secara real-time.
              Berikut alur lengkapnya dari daftar sampai transaksi selesai.
            </p>
          </div>
        </section>

        {/* ALUR TRANSAKSI */}
        <section>
          <h3 className="font-display font-extrabold text-base text-ink tracking-tight mb-4">
            Alur Transaksi
          </h3>
          <ol className="relative space-y-5">
            {/* garis penghubung */}
            <span className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-ink-faint" aria-hidden />
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4">
                <div className="relative z-10 w-10 h-10 rounded-full bg-brand-500 text-ink flex items-center justify-center shrink-0 border-4 border-surface">
                  <s.icon size={18} />
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-brand-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-display font-extrabold text-sm text-ink tracking-tight">
                      {s.title}
                    </h4>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed mt-1">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* BENEFIT */}
        <section>
          <h3 className="font-display font-extrabold text-base text-ink tracking-tight mb-4">
            Kenapa Rongsok.in?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b.title} className="bg-surface-raised rounded-2xl p-4 flex gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                  <b.icon size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-ink">{b.title}</h4>
                  <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-100 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-display font-extrabold text-lg text-brand-800 tracking-tight">
            Siap mulai daur ulang?
          </h3>
          <p className="text-xs text-brand-700 leading-relaxed max-w-sm mx-auto">
            Jual sampahmu sekarang, atau pantau dampak ekologismu di papan peringkat.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1 max-w-sm mx-auto">
            <Link href="/orders/new" className="flex-1">
              <span className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-ink font-bold py-3 rounded-2xl transition-colors text-sm cursor-pointer">
                Mulai Jual Sekarang <ArrowRight size={16} />
              </span>
            </Link>
            <Link href="/eco" className="flex-1">
              <span className="w-full inline-flex items-center justify-center gap-2 border border-brand-800 text-brand-800 hover:bg-brand-200 font-bold py-3 rounded-2xl transition-colors text-sm cursor-pointer">
                <Leaf size={16} /> Dampak Ekologis
              </span>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
