// Upload helper Cloudinary (direct dari FE, unsigned preset).
// Dipakai untuk foto KTP (KYC) & foto sampah (anti fake-order) & foto profil.
// Mode demo: kalau env Cloudinary belum di-set, kembalikan object URL lokal supaya UI tetap jalan.

export interface UploadResult {
  url: string;
  /** true bila benar-benar terunggah ke Cloudinary; false = object URL lokal (demo). */
  remote: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function uploadToCloudinary(file: File | Blob): Promise<UploadResult> {
  if (file.size > MAX_BYTES) {
    throw new Error('Foto terlalu besar. Maksimal 5MB.');
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Demo / dev tanpa env → object URL lokal (tidak persist, tapi UI jalan)
  if (!cloudName || !uploadPreset) {
    return { url: URL.createObjectURL(file), remote: false };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Gagal mengunggah foto. Coba lagi.');
  }
  const data = await res.json();
  if (!data.secure_url) {
    throw new Error('Gagal mengunggah foto. Coba lagi.');
  }
  return { url: data.secure_url as string, remote: true };
}
