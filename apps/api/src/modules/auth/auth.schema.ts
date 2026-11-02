import { z } from 'zod';

export const RegisterInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100),
    email: z
      .string()
      .trim()
      .max(254)
      .email('Please enter a valid email address')
      .transform((e) => e.trim().toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .refine(
        (value) => Buffer.byteLength(value, 'utf8') <= 72,
        'Password must be at most 72 bytes',
      ),
    workspaceName: z.string().trim().min(2).max(100).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email('Please enter a valid email address')
      .transform((e) => e.trim().toLowerCase()),
    password: z.string().min(1, 'Password is required').max(1024),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .email('Please enter a valid email address')
    .transform((e) => e.trim().toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .refine(
      (value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Password must be at most 72 bytes',
    ),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
