import { apiClient } from './client';
import { Category, CategoryResponse, mapCategory } from './types';

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const resp = await apiClient<CategoryResponse[]>('/api/categories', { signal });
  return resp.map(mapCategory);
}

export async function getCategoryDetail(
  id: string,
  signal?: AbortSignal
): Promise<Category | null> {
  try {
    const resp = await apiClient<CategoryResponse>(`/api/categories/${id}`, { signal });
    return mapCategory(resp);
  } catch {
    return null;
  }
}

export async function createCategory(
  data: { name: string; description?: string },
  signal?: AbortSignal
): Promise<Category> {
  const resp = await apiClient<CategoryResponse>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
    signal,
  });
  return mapCategory(resp);
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string },
  signal?: AbortSignal
): Promise<Category> {
  const resp = await apiClient<CategoryResponse>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    signal,
  });
  return mapCategory(resp);
}

export async function deleteCategory(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  await apiClient<void>(`/api/categories/${id}`, {
    method: 'DELETE',
    signal,
  });
}
