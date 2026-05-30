"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Building2, Archive, Scale, DollarSign, Users, CheckCircle, 
  XCircle, Star, Plus, ShieldCheck, FileText, LogOut, 
  TrendingUp, BarChart2, Check, RefreshCw, Eye, Landmark
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { useWasteCategories } from "@/hooks/useDiscovery";
import toast from "react-hot-toast";

// Mock Data for Admin
const INITIAL_MITRA_QUEUE = [
  { id: "MTR-001", name: "Pak Slamet", shopName: "Lapak Slamet Sleman", area: "Sleman, DIY", phone: "08123456789", status: "PENDING" },
  { id: "MTR-002", name: "Ibu Hartini", shopName: "Rosok Berkah Bantul", area: "Bantul, DIY", phone: "08987654321", status: "PENDING" },
  { id: "MTR-003", name: "Mas Bagus", shopName: "Bagus E-Waste Specialist", area: "Yogyakarta Kota", phone: "087712345678", status: "PENDING" }
];

const WEEKLY_TRANSACTIONS = [
  { day: "Senin", weight: 320, amount: 960000 },
  { day: "Selasa", weight: 450, amount: 1350000 },
  { day: "Rabu", weight: 290, amount: 870000 },
  { day: "Kamis", weight: 580, amount: 1740000 },
  { day: "Jumat", weight: 410, amount: 1230000 },
  { day: "Sabtu", weight: 620, amount: 1860000 },
  { day: "Minggu", weight: 210, amount: 630000 }
];

export default function AdminDashboard() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const initFromStorage = useAuthStore((state) => state.initFromStorage);

  const { data: dbCategories, refetch: refetchCategories } = useWasteCategories();
  const [mitraQueue, setMitraQueue] = useState(INITIAL_MITRA_QUEUE);
  
  // Premium KYC Modal States
  const [selectedMitraKYC, setSelectedMitraKYC] = useState<any | null>(null);

  // Pricing manager states
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editPriceName, setEditPriceName] = useState("");
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  // Protect Admin Route
  useEffect(() => {
    if (token && user && user.role !== "ADMIN") {
      router.replace(user.role === "COLLECTOR" ? "/collector" : "/dashboard");
    }
  }, [token, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Mitra handlers
  const handleApproveMitra = (id: string, name: string) => {
    setMitraQueue(prev => prev.filter(m => m.id !== id));
    toast.success(`Akun Mitra ${name} berhasil diverifikasi!`, {
      icon: "🟢",
    });
    if (selectedMitraKYC?.id === id) {
      setSelectedMitraKYC(null);
    }
  };

  const handleRejectMitra = (id: string, name: string) => {
    setMitraQueue(prev => prev.filter(m => m.id !== id));
    toast.error(`Pendaftaran Mitra ${name} ditolak.`, {
      icon: "🔴",
    });
    if (selectedMitraKYC?.id === id) {
      setSelectedMitraKYC(null);
    }
  };

  // Price manager simulated action
  const handleUpdatePriceSimulated = (name: string) => {
    toast.success(`Base price untuk kategori ${name} berhasil diperbarui di katalog!`, {
      icon: "💸"
    });
    setEditingCatId(null);
  };

  const handleAddCategorySimulated = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    toast.success(`Kategori baru "${newCatName}" berhasil ditambahkan ke database!`, {
      icon: "✨"
    });
    setNewCatName("");
  };

  // Compute KPI values
  const totalWeightKg = WEEKLY_TRANSACTIONS.reduce((sum, item) => sum + item.weight, 0) + 1240; // Simulated historical weight
  const totalWeightTons = (totalWeightKg / 1000).toFixed(2);
  const totalPayout = WEEKLY_TRANSACTIONS.reduce((sum, item) => sum + item.amount, 0) + 3800000; // Simulated payout
  const platformFee = totalPayout * 0.1; // 10% fee

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* ADMIN MAJESTIC HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-6 md:px-8 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-md shadow-emerald-500/10">
            R
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base md:text-lg tracking-tight text-white flex items-center gap-2">
              Rongsok.in Admin
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                Console
              </span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">Management Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 hidden md:block">
            Logged as: <span className="text-white">{user?.name || "Administrator"}</span>
          </span>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 border border-slate-800 rounded-full hover:bg-red-500/10 transition-all shadow-sm cursor-pointer"
          >
            <LogOut size={14} /> Keluar
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-6xl w-full mx-auto space-y-8">
        
        {/* BACKEND STATUS NOTICE */}
        <div className="backdrop-blur-md bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-400 shadow-lg animate-pulse">
          <ShieldCheck size={20} className="shrink-0" />
          <div className="text-xs md:text-sm font-semibold">
            <span className="font-extrabold uppercase tracking-wider text-[9px] bg-amber-500/20 px-2 py-0.5 rounded mr-2 border border-amber-500/30">Status Sistem</span>
            Endpoint BE bagian (Manajemen KYC &amp; Statistik Global) belum dibuat
          </div>
        </div>
        
        {/* KPI CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Total Terkumpul", val: `${totalWeightTons} Ton`, desc: "Penyelamatan Lingkungan", icon: Archive, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            { title: "Transaksi Aktif", val: "12 Unit", desc: "Real-time Order", icon: Scale, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { title: "Total Payout", val: `Rp ${totalPayout.toLocaleString()}`, desc: "Sirkulasi Finansial", icon: DollarSign, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { title: "Pendapatan Platform", val: `Rp ${platformFee.toLocaleString()}`, desc: "10% Platform Fee", icon: ShieldCheck, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }
          ].map((kpi, idx) => (
            <div key={idx} className="backdrop-blur-md bg-slate-900/40 border border-slate-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{kpi.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
              </div>
              <div>
                <h3 className="font-display font-black text-xl md:text-2xl text-white tracking-tight">{kpi.val}</h3>
                <span className="text-[9px] font-medium text-slate-400 mt-1 block">{kpi.desc}</span>
              </div>
            </div>
          ))}
        </section>

        {/* CHARTS & MITRA QUEUE CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CHARTS PANEL */}
          <section className="lg:col-span-2 backdrop-blur-md bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                  <BarChart2 className="text-emerald-400" size={18} />
                  Akumulasi Setoran Mingguan
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Statistik volume rongsok terkumpul per hari</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <TrendingUp size={12} /> +12.4%
              </span>
            </div>

            {/* Custom bar chart using Tailwind CSS */}
            <div className="h-48 flex items-end justify-between gap-2.5 pt-4 border-b border-slate-800">
              {WEEKLY_TRANSACTIONS.map((item, idx) => {
                const maxWeight = 700;
                const pct = (item.weight / maxWeight) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                    <span className="text-[9px] font-mono font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {item.weight}kg
                    </span>
                    <div 
                      style={{ height: `${pct}%` }} 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all shadow-md group-hover:shadow-emerald-500/20"
                    />
                    <span className="text-[10px] font-bold text-slate-400 mt-2 block">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* MITRA VERIFICATION QUEUE */}
          <section className="backdrop-blur-md bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <Users className="text-blue-400" size={18} />
                Verifikasi Mitra Baru
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Antrean verifikasi berkas pendaftar baru</p>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {mitraQueue.length > 0 ? (
                mitraQueue.map((mitra) => (
                  <div key={mitra.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-white leading-tight">{mitra.shopName}</h4>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 block">{mitra.name} • {mitra.area}</span>
                      </div>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        KYC Queue
                      </span>
                    </div>

                    <div className="flex gap-2 border-t border-slate-800/80 pt-2.5">
                      <button 
                        onClick={() => handleRejectMitra(mitra.id, mitra.name)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button 
                        onClick={() => setSelectedMitraKYC(mitra)}
                        className="flex-grow-[2] bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Eye size={12} /> Tinjau Berkas
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border border-slate-800 border-dashed rounded-xl p-8 flex flex-col items-center text-center">
                  <CheckCircle size={28} className="text-emerald-500 mb-2" />
                  <span className="text-xs font-bold text-white">Antrean Bersih</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Seluruh pendaftaran mitra kolektor telah diverifikasi.</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* PRICING & CATEGORIES MANAGER */}
        <section className="backdrop-blur-md bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                <Archive className="text-purple-400" size={18} />
                Base Price & Kategori Manager
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Atur acuan harga pokok dasar rongsokan (base price) nasional</p>
            </div>
            
            <form onSubmit={handleAddCategorySimulated} className="flex gap-2 shrink-0">
              <Input 
                type="text" 
                placeholder="Kategori baru..." 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-slate-900/60 border-slate-800 text-white rounded-xl text-xs h-9 w-40" 
              />
              <Button type="submit" className="h-9 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/10">
                <Plus size={14} /> Tambah
              </Button>
            </form>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {dbCategories?.map((cat) => {
              const isEditing = editingCatId === cat.id;
              return (
                <div key={cat.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white leading-tight">{cat.name}</h4>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">Waste Category</span>
                    </div>
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
                      <Archive size={16} />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">BASE PRICE</span>
                      {isEditing ? (
                        <div className="flex gap-1.5 mt-1">
                          <Input 
                            type="number" 
                            placeholder="Harga..." 
                            value={editPriceName}
                            onChange={(e) => setEditPriceName(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white text-xs h-8 p-1 font-mono rounded"
                          />
                          <button 
                            onClick={() => handleUpdatePriceSimulated(cat.name)}
                            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded flex items-center justify-center text-slate-950 cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                          Rp {(cat.name === "Kardus" ? 2200 : cat.name === "Plastik" ? 4500 : cat.name === "Kertas" ? 1800 : cat.name === "Logam" ? 8500 : 35000).toLocaleString()}<span className="text-[10px] font-medium text-slate-400">/Kg</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <button 
                      onClick={() => {
                        setEditingCatId(cat.id);
                        setEditPriceName((cat.name === "Kardus" ? 2200 : cat.name === "Plastik" ? 4500 : cat.name === "Kertas" ? 1800 : cat.name === "Logam" ? 8500 : 35000).toString());
                      }}
                      className="w-full text-center py-1.5 border border-slate-800 hover:border-emerald-500/20 text-slate-400 hover:text-emerald-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer bg-slate-950/20 hover:bg-emerald-500/5"
                    >
                      Ubah Base Price
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* PREMIUM HIGH-FIDELITY KYC PREVIEW MODAL */}
      {selectedMitraKYC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 text-slate-100">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">Tinjau Dokumen KYC</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pemohon: <span className="text-emerald-400 font-bold">{selectedMitraKYC.name}</span></p>
              </div>
              <button 
                onClick={() => setSelectedMitraKYC(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Document Gallery Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* HTML-Drawn Indonesian KTP Card */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">FOTO KARTU IDENTITAS (KTP)</label>
                <div className="bg-gradient-to-r from-sky-400 via-sky-300 to-sky-200 border border-sky-100 rounded-xl p-3 shadow-lg relative text-slate-900 aspect-[1.58/1] flex flex-col justify-between overflow-hidden">
                  {/* Visual chip and holograms */}
                  <div className="absolute top-2 right-2 w-8 h-6 bg-slate-200/50 rounded flex items-center justify-center text-[7px] font-black uppercase text-slate-600 border border-slate-300/40">PROV DIY</div>
                  
                  <div>
                    <h5 className="font-black text-[8px] tracking-wide text-center uppercase text-slate-800 leading-tight">PROVINSI DAERAH ISTIMEWA YOGYAKARTA</h5>
                    <h6 className="font-extrabold text-[7px] text-center uppercase text-slate-700 leading-tight -mt-0.5">{selectedMitraKYC.area.toUpperCase()}</h6>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 flex-1 items-end">
                    <div className="col-span-2 space-y-0.5 text-[6px] font-bold text-slate-900 font-mono">
                      <div>NIK : 340409280582000{selectedMitraKYC.id.slice(-1)}</div>
                      <div>Nama : {selectedMitraKYC.name.toUpperCase()}</div>
                      <div>Alamat : {selectedMitraKYC.area}</div>
                      <div>Pekerjaan : Wirausaha Daur Ulang</div>
                      <div>Status : Kawin</div>
                      <div>Kewarganegaraan : WNI</div>
                    </div>
                    {/* Simulated avatar photo */}
                    <div className="col-span-1 bg-sky-100/60 rounded border border-sky-400/40 flex flex-col items-center justify-center p-1.5 h-full relative overflow-hidden">
                      <Users size={24} className="text-sky-800/60" />
                      <div className="text-[5px] font-black text-slate-600 mt-1">VERIFIED</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selfie with ID Card Mockup */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">FOTO SELFIE + KTP</label>
                <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden aspect-[1.58/1] flex flex-col items-center justify-center relative p-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
                    <Users size={28} />
                  </div>
                  <div className="bg-sky-400/20 border border-sky-400/30 text-sky-300 text-[6px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={8} className="text-sky-300" /> Face Matching 98% Match
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 mt-2 block">Foto selfie beresolusi tinggi terkonfirmasi cocok.</span>
                </div>
              </div>

              {/* Surat Izin Lapak / SIUP Mockup (Full Width) */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SURAT IZIN OPERASIONAL LAPAK DAUR ULANG</label>
                <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Landmark size={20} />
                  </div>
                  <div className="flex-1 space-y-1 text-slate-300 text-xs leading-relaxed">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/80">
                      <h6 className="font-extrabold text-white uppercase text-[10px]">IZIN OPERASIONAL: #SIUP-ROS-2026-{selectedMitraKYC.id}</h6>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SIUP VALID</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Dikeluarkan oleh: **Dinas Lingkungan Hidup Kabupaten Sleman/Bantul/Kota DIY**</p>
                    <div className="grid grid-cols-2 gap-4 text-[9px] font-mono text-slate-400 pt-1">
                      <div>Jenis Usaha: Penampungan & Penyortiran Logam/Kardus/Plastik</div>
                      <div>Luas Lapak: ~120 meter persegi (Terverifikasi GPS)</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 border-t border-slate-800 pt-5">
              <button 
                onClick={() => handleRejectMitra(selectedMitraKYC.id, selectedMitraKYC.name)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer text-center"
              >
                Tolak Pendaftaran
              </button>
              <button 
                onClick={() => handleApproveMitra(selectedMitraKYC.id, selectedMitraKYC.name)}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <CheckCircle size={14} /> Setujui Mitra & Aktifkan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
