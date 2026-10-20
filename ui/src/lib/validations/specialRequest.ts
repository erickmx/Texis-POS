import { z } from "zod";

// Validation schemas for the special request drawer forms. Messages are i18n
// keys resolved via getErrorMessage(key) -> t(key), mirroring the
// productSchema pattern in ProductForm.tsx. Factories keep the drawer (2a)
// and create (2b) forms on their own i18n key trees with identical semantics.
const nullableProgressWith = (key: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z
      .number()
      .int(key)
      .min(0, key)
      .max(100, key)
      .nullable(),
  );

const nonNegativeAmountWith = (key: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0, key),
  );

const optionalDeadlineWith = (key: string) =>
  z
    .string()
    .refine(
      (v) => v === "" || !Number.isNaN(new Date(v).getTime()),
      key,
    );

const DRAWER_KEYS = {
  progress: "specialRequests.drawer.errors.progress_range",
  fiscal: "specialRequests.drawer.errors.fiscal_nonnegative",
  deadline: "specialRequests.drawer.errors.deadline_invalid",
};

export const specialRequestSchema = z.object({
  title: z.string().max(200, "specialRequests.drawer.errors.title_max"),
  description: z.string(),
  deadline: optionalDeadlineWith(DRAWER_KEYS.deadline),
  phase: z.string(),
  progressPct: nullableProgressWith(DRAWER_KEYS.progress),
  gastoTerceros: nonNegativeAmountWith(DRAWER_KEYS.fiscal),
  serviceFee: nonNegativeAmountWith(DRAWER_KEYS.fiscal),
});

export type SpecialRequestFormData = z.infer<typeof specialRequestSchema>;

const CREATE_KEYS = {
  progress: "specialRequests.newRequestForm.errors.progress_range",
  fiscal: "specialRequests.newRequestForm.errors.fiscal_nonnegative",
  deadline: "specialRequests.newRequestForm.errors.deadline_invalid",
};

export const specialRequestCreateSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "specialRequests.newRequestForm.errors.customer_required")
    .max(120, "specialRequests.newRequestForm.errors.customer_max"),
  customerWa: z.string(),
  title: z
    .string()
    .max(200, "specialRequests.newRequestForm.errors.title_max"),
  description: z.string(),
  deadline: optionalDeadlineWith(CREATE_KEYS.deadline),
  phase: z.string(),
  progressPct: nullableProgressWith(CREATE_KEYS.progress),
  gastoTerceros: nonNegativeAmountWith(CREATE_KEYS.fiscal),
  serviceFee: nonNegativeAmountWith(CREATE_KEYS.fiscal),
});

export type SpecialRequestCreateFormData = z.infer<
  typeof specialRequestCreateSchema
>;
