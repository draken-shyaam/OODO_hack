import { z } from "zod";

// Parallel comma lists (?productIds=1,2,3&qtys=10,5,8) rather than a
// nested array, matching the existing GET /api/signals/active query style.
export const checkpointQuerySchema = z.object({
  productIds: z.string().min(1, "productIds is required"),
  qtys: z.string().min(1, "qtys is required"),
});

export const pinActionSchema = z.object({
  productId: z.coerce.number().int().positive(),
  type: z.enum(["EXPEDITE", "VENDOR_SWITCH", "QTY_ADJUST", "ACCEPT_RISK"]),
  vendorId: z.coerce.number().int().positive().optional(),
  qty: z.coerce.number().positive().optional(),
});

export type PinAction = z.infer<typeof pinActionSchema>;
