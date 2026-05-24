import { apiClient } from './client';
import {
  Product,
  ProductResponse,
  PaginatedResponse,
  CreateProductDTO,
  UpdateProductDTO,
  mapProduct,
  mapProductToDTO,
} from './types';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

function buildQuery(params: ProductListParams): string {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.sortBy) qs.set('sort_by', params.sortBy);
  if (params.sortOrder) qs.set('sort_order', params.sortOrder);
  const q = qs.toString();
  return q ? `?${q}` : '';
}

export async function getProductsPaginated(
  params: ProductListParams = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<Product>> {
  const resp = await apiClient<{ data: ProductResponse[]; meta: { page: number; limit: number; total: number; total_pages: number } }>(
    `/api/products${buildQuery(params)}`,
    { signal }
  );
  return {
    data: resp.data.map(mapProduct),
    meta: {
      page: resp.meta.page,
      limit: resp.meta.limit,
      total: resp.meta.total,
      totalPages: resp.meta.total_pages,
    },
  };
}

export async function getProductDetail(
  id: string,
  signal?: AbortSignal
): Promise<Product | null> {
  try {
    const resp = await apiClient<ProductResponse>(`/api/products/${id}`, { signal });
    return mapProduct(resp);
  } catch {
    return null;
  }
}

export async function createProduct(
  data: CreateProductDTO,
  signal?: AbortSignal
): Promise<Product> {
  const resp = await apiClient<ProductResponse>('/api/products', {
    method: 'POST',
    body: JSON.stringify(mapProductToDTO(data)),
    signal,
  });
  return mapProduct(resp);
}

export async function updateProduct(
  id: string,
  data: UpdateProductDTO,
  signal?: AbortSignal
): Promise<Product> {
  const resp = await apiClient<ProductResponse>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(mapProductToDTO(data)),
    signal,
  });
  return mapProduct(resp);
}

export async function deleteProduct(
  id: string,
  signal?: AbortSignal
): Promise<void> {
  await apiClient<void>(`/api/products/${id}`, {
    method: 'DELETE',
    signal,
  });
}

export async function getTotalProducts(signal?: AbortSignal): Promise<number> {
  const resp = await apiClient<{ total: number }>('/api/products/total', { signal });
  return resp.total;
}

export async function getStockLowProducts(signal?: AbortSignal): Promise<Product[]> {
  const resp = await apiClient<ProductResponse[]>('/api/products/stock/low', { signal });
  return resp.map(mapProduct);
}
