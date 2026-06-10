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
