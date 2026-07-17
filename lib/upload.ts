import api from './axios';

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

  try {
    const formData = new FormData();
    // Backend expects a single file field named 'image'
    formData.append('image', file);

    const res = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data?.status === 'success' && res.data?.data?.url) {
      return { url: res.data.data.url, remote: true };
    }
    throw new Error('Gagal mengunggah foto.');
  } catch (error) {
    console.warn('Backend upload failed, falling back to local object URL:', error);
    try {
      return { url: URL.createObjectURL(file), remote: false };
    } catch (e) {
      throw new Error('Gagal mengunggah foto. Coba lagi.');
    }
  }
}
