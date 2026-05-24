import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'inventory.modal.errors.name_required')
    .max(120, 'inventory.modal.errors.name_max'),
  description: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  satCode: z
    .string()
    .regex(/^\d{8}$/, 'inventory.modal.errors.sat_code_invalid')
    .optional()
    .or(z.literal('')),
  buyPrice: z.coerce
    .number()
    .positive('inventory.modal.errors.buy_price_positive'),
  salePrice: z.coerce
    .number()
    .positive('inventory.modal.errors.sale_price_positive'),
  stock: z.coerce
    .number()
    .int('inventory.modal.errors.stock_nonnegative')
    .nonnegative('inventory.modal.errors.stock_nonnegative'),
  image: z.instanceof(File).optional().or(z.string().url().optional()).or(z.null()),
});

export type ProductFormData = z.infer<typeof productSchema>;
