import { apiClient } from './client';

export async function uploadImage(
  file: File,
  signal?: AbortSignal
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await apiClient<{ url: string }>('/api/storage/upload', {
    method: 'POST',
    body: formData,
    signal,
  });
  return resp.url;
}
