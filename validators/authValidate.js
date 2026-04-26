import { z } from 'zod';

export const registerSchema = z.object({
  fullname: z.string().min(2, "Name is too short"),
  gmail: z.string().email("Invalid email format"),
  pass: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  role: z.enum(['admin', 'team_lead', 'user']),
  tech_stack: z.array(z.string()).or(z.string())
});

export const validatePassword=z.object({
    pass: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});