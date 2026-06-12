// Upload helper foto. Kini lewat endpoint backend POST /api/v1/upload (multer field 'image'),
// yang melakukan signed upload ke Cloudinary di server — jadi FE TIDAK butuh env Cloudinary lagi.
// Dipakai untuk foto KTP (KYC), foto sampah (anti fake-order), & foto profil/avatar.
//
// Fallback object URL lokal dipakai bila:
//   - upload backend gagal / server belum siap (mode demo), atau
//   - belum ada token (mis. upload KTP saat REGISTER, sebelum akun jadi) → endpoint 401.
// Object URL tidak persist (hilang saat reload) — UI tetap jalan, tapi tidak tersimpan.

import api from './axios';

export interface UploadResult {
  url: string;
  /** true bila benar-benar terunggah ke server (persisten); false = object URL lokal (demo/tanpa auth). */
  remote: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Perkecil & kompres gambar di browser sebelum upload (khusus avatar/foto kecil).
 * Mencegah foto HP besar gagal/lambat, hasilnya jauh di bawah 5MB.
 * JANGAN dipakai untuk foto KTP / foto sampah (butuh resolusi penuh utk verifikasi).
 */
export async function downscaleImage(
  file: File,
  maxDim = 512,
  quality = 0.85
): Promise<Blob> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject(new Error('Gagal membaca file.'));
      fr.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Gagal memuat gambar.'));
      i.src = dataUrl;
    });

    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    return blob || file;
  } catch {
    // Kalau gagal kompres, pakai file asli (tetap dibatasi 5MB di uploadToCloudinary)
    return file;
  }
}

/**
 * Perkecil gambar dan encode jadi data URL JPEG kecil (~15-30KB).
 * Dipakai sebagai CADANGAN avatar bila upload ke server gagal: data URL
 * tersimpan langsung di kolom avatarUrl (persist & tampil tanpa server file).
 */
export async function downscaleToDataUrl(
  file: File | Blob,
  maxDim = 256,
  quality = 0.72
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('Gagal membaca file.'));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Gagal memuat gambar.'));
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung.');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function uploadToCloudinary(file: File | Blob): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error('Foto terlalu besar. Maksimal 5MB.');
  }

  try {
    const formData = new FormData();
    // BE mengharapkan field bernama 'image' (multer upload.single('image')).
    formData.append('image', file);

    // PENTING: jangan set header Content-Type manual. Biarkan browser yang
    // menambahkan boundary multipart — kalau di-hardcode 'multipart/form-data'
    // tanpa boundary, multer di server gagal mem-parse file.
    const res = await api.post('/upload', formData);

    const url = res.data?.data?.url;
    if (res.data?.status === 'success' && url) {
      return { url, remote: true };
    }
    throw new Error('Respons upload tidak valid.');
  } catch (err) {
    console.warn('[upload] gagal unggah ke backend, fallback object URL lokal:', err);
    return { url: URL.createObjectURL(file), remote: false };
  }
}
