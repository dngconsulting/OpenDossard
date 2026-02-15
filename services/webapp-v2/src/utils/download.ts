import { apiFetchBlob } from '@/api/client';

export async function downloadFromApi(endpoint: string, filename: string): Promise<void> {
  const blob = await apiFetchBlob(endpoint);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
