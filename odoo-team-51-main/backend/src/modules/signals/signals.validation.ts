import { z } from "zod";

export const createSignalSchema = z.object({
  sourceType: z.enum(["carpenter", "contractor", "dealer", "supplier", "warehouse_partner", "transporter", "employee", "procurement_partner"]),
  productId: z.coerce.number().int().positive().optional(),
  category: z.string().optional(),
  signalType: z.enum(["shortage", "price_change", "delay", "availability"]),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
});
