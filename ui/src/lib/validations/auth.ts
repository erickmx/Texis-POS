import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.validation.email_required' }),
  password: z
    .string()
    .min(1, { message: 'auth.validation.password_required' }),
  website: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
