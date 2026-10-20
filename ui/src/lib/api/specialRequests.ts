import { apiClient } from "./client";
import { SpecialOrder, SpecialOrderResponse, mapSpecialOrder } from "./types";

export async function getSpecialRequests(): Promise<SpecialOrder[]> {
  const responses = await apiClient<SpecialOrderResponse[]>(
    "/api/orders/special",
  );
  return responses.map(mapSpecialOrder);
}

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<{ id: string; status: string }> {
  return apiClient<{ id: string; status: string }>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface UpdateOrderDetailsPayload {
  title: string;
  task_description: string;
  deadline: string | null;
  phase: string;
  progress_pct: number | null;
  gasto_terceros: number;
  service_fee: number;
}

export async function updateOrderDetails(
  id: string,
  payload: UpdateOrderDetailsPayload,
): Promise<{ id: string; total_amount: number }> {
  return apiClient<{ id: string; total_amount: number }>(
    `/api/orders/${id}/details`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export interface CreateSpecialRequestPayload {
  title: string;
  task_description: string;
  deadline: string | null;
  phase: string;
  progress_pct: number | null;
  gasto_terceros: number;
  service_fee: number;
  customer_name: string;
  customer_wa?: string;
  attachments: string[];
}

export async function createSpecialRequest(
  payload: CreateSpecialRequestPayload,
): Promise<{ id: string; folio: number }> {
  return apiClient<{ id: string; folio: number }>("/api/orders/special", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadOrderAttachment(
  id: string,
  file: File,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<{ url: string }>(`/api/orders/${id}/attachments`, {
    method: "POST",
    body: formData,
  });
}

export async function deleteOrderAttachment(
  id: string,
  url: string,
): Promise<{ deleted: boolean }> {
  return apiClient<{ deleted: boolean }>(`/api/orders/${id}/attachments`, {
    method: "DELETE",
    body: JSON.stringify({ url }),
  });
}
