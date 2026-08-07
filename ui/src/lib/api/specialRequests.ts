import { apiClient } from './client';
import { SpecialOrder, SpecialOrderResponse, mapSpecialOrder } from './types';

export async function getSpecialRequests(): Promise<SpecialOrder[]> {
  const responses = await apiClient<SpecialOrderResponse[]>('/api/orders/special');
  return responses.map(mapSpecialOrder);
}

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<{ id: string; status: string }> {
  return apiClient<{ id: string; status: string }>(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
