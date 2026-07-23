import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    role: z.enum(['ADMIN', 'AGENT', 'CUSTOMER']),
    // Required only when role === 'CUSTOMER'; validated further in the service layer.
    fullName: z.string().trim().min(2).optional(),
    dob: z.coerce.date().optional(),
    phone: z.string().trim().min(6).optional(),
    address: z.string().trim().min(3).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'CUSTOMER') {
      if (!data.fullName) {
        ctx.addIssue({
          code: 'custom',
          path: ['fullName'],
          message: 'fullName is required for CUSTOMER registration',
        });
      }
      if (!data.dob) {
        ctx.addIssue({
          code: 'custom',
          path: ['dob'],
          message: 'dob is required for CUSTOMER registration',
        });
      }
      if (!data.phone) {
        ctx.addIssue({
          code: 'custom',
          path: ['phone'],
          message: 'phone is required for CUSTOMER registration',
        });
      }
      if (!data.address) {
        ctx.addIssue({
          code: 'custom',
          path: ['address'],
          message: 'address is required for CUSTOMER registration',
        });
      }
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
