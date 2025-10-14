import { z } from 'zod';

export const customerSchema = z.object({
  company: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  shipTo: z.string().optional(),
});