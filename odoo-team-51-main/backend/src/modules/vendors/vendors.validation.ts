import { z } from "zod";

export const createVendorSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  contact: z.string().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
});

export const createQualityIncidentSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
});
