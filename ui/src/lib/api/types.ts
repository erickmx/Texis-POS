export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface ProductResponse {
  id: string;
  title: string;
  description?: string;
  sku?: string;
  clave_sat: string;
  unit_sat?: string;
  buy_price: number;
  sale_price: number;
  stock_level: number;
  reorder_point?: number;
  image_url?: string;
  is_deleted: boolean;
  created_at: string;
  categories?: CategoryResponse[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  satCode: string;
  unitSat?: string;
  buyPrice: number;
  salePrice: number;
  stockLevel: number;
  reorderPoint?: number;
  image?: string;
  isDeleted: boolean;
  createdAt: string;
  categories?: Category[];
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  sku?: string;
  satCode: string;
  unitSat?: string;
  buyPrice: number;
  salePrice: number;
  stockLevel: number;
  reorderPoint?: number;
  image?: string;
  categoryIds?: string[];
}

export type UpdateProductDTO = Partial<CreateProductDTO>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// Mappers — SINGLE SOURCE OF TRUTH
export function mapProduct(r: ProductResponse): Product {
  return {
    id: r.id,
    name: r.title,
    description: r.description,
    sku: r.sku,
    satCode: r.clave_sat,
    unitSat: r.unit_sat,
    buyPrice: r.buy_price,
    salePrice: r.sale_price,
    stockLevel: r.stock_level,
    reorderPoint: r.reorder_point,
    image: r.image_url,
    isDeleted: r.is_deleted,
    createdAt: r.created_at,
    categories: r.categories ? r.categories.map(mapCategory) : undefined,
  };
}

export function mapProductToDTO(
  p: CreateProductDTO | UpdateProductDTO,
): Record<string, unknown> {
  const dto: Record<string, unknown> = {};
  if ("name" in p && p.name !== undefined) dto.title = p.name;
  if (p.description !== undefined) dto.description = p.description;
  if (p.sku !== undefined) dto.sku = p.sku;
  if (p.satCode !== undefined) dto.clave_sat = p.satCode;
  if (p.unitSat !== undefined) dto.unit_sat = p.unitSat;
  if (p.buyPrice !== undefined) dto.buy_price = p.buyPrice;
  if (p.salePrice !== undefined) dto.sale_price = p.salePrice;
  if (p.stockLevel !== undefined) dto.stock_level = p.stockLevel;
  if (p.reorderPoint !== undefined) dto.reorder_point = p.reorderPoint;
  if (p.image !== undefined) dto.image_url = p.image;
  if (p.categoryIds !== undefined) dto.category_ids = p.categoryIds;
  return dto;
}

export function mapCategory(r: CategoryResponse): Category {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
  };
}

// --- Special Requests ---

export interface SpecialOrderResponse {
  folio: number;
  orderId: string;
  customerName: string;
  customerWa: string;
  status: string;
  title: string;
  description: string;
  deadline: string | null;
  attachmentCount: number;
  attachments: string[];
  phase: string | null;
  progressPct: number | null;
  gastoTerceros: number;
  serviceFee: number;
}

export interface SpecialOrder {
  folio: number;
  orderId: string;
  customerName: string;
  customerWa: string;
  status: "pending" | "in_progress" | "done";
  title: string;
  description: string;
  deadline: string | null;
  attachmentCount: number;
  attachments: string[];
  phase: string | null;
  progressPct: number | null;
  gastoTerceros: number;
  serviceFee: number;
}

export function mapSpecialOrder(r: SpecialOrderResponse): SpecialOrder {
  return {
    folio: r.folio,
    orderId: r.orderId,
    customerName: r.customerName ?? "",
    customerWa: r.customerWa ?? "",
    status: r.status as SpecialOrder["status"],
    title: r.title ?? "",
    description: r.description ?? "",
    deadline: r.deadline ?? null,
    attachmentCount: r.attachmentCount ?? 0,
    attachments: r.attachments ?? [],
    phase: r.phase ?? null,
    progressPct: r.progressPct ?? null,
    gastoTerceros: r.gastoTerceros ?? 0,
    serviceFee: r.serviceFee ?? 0,
  };
}
