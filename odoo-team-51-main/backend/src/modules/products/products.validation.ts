import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z.string().min(1),
    dimensions: z.string().optional(),
    specifications: z.string().optional(),
    leadTimeDays: z.coerce.number().int().nonnegative().optional(),
    movementRate: z.coerce.number().nonnegative().optional(),
    minOrderQty: z.coerce.number().nonnegative().optional(),
    lowStockThreshold: z.coerce.number().nonnegative().optional(),
    salesPrice: z.coerce.number().positive(),
    costPrice: z.coerce.number().positive(),
    procureOnDemand: z.boolean().optional().default(false),
    procurementMethod: z.enum(["purchase", "manufacturing"]).optional(),
    vendorId: z.coerce.number().int().positive().optional(),
    bomId: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => !d.procureOnDemand || !!d.procurementMethod, {
    message: "procurementMethod is required when procureOnDemand is true",
    path: ["procurementMethod"],
  })
  .refine((d) => !(d.procureOnDemand && d.procurementMethod === "purchase") || !!d.vendorId, {
    message: "vendorId is required when procurementMethod is purchase",
    path: ["vendorId"],
  });
// Note: bomId is intentionally NOT required at create time even when
// procurementMethod is "manufacturing" — a BoM's own productId must
// reference this product, so the only valid workflow is: create the
// product, then create its BoM, then PATCH bomId onto the product
// (exactly the two-step pattern seed.ts uses). Requiring bomId here would
// make it impossible to ever create the first manufacturing-method product.
// Procurement automation itself (engines/procurementAutomationEngine.ts)
// still checks bomId is actually set before attempting to auto-create an MO.

// Note: onHandQty / freeToUseQty are deliberately NOT accepted here, even
// for an Admin. Stock can only change through /reconcile-stock (manual
// reconciliation) or through Sales/Purchase/Manufacturing transactions —
// never a raw field edit — so the Stock Ledger can never silently drift
// out of sync with the product's actual on-hand quantity.
export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  dimensions: z.string().optional(),
  specifications: z.string().optional(),
  leadTimeDays: z.coerce.number().int().nonnegative().optional(),
  movementRate: z.coerce.number().nonnegative().optional(),
  minOrderQty: z.coerce.number().nonnegative().optional(),
  lowStockThreshold: z.coerce.number().nonnegative().optional(),
  salesPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  procureOnDemand: z.boolean().optional(),
  procurementMethod: z.enum(["purchase", "manufacturing"]).optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  bomId: z.coerce.number().int().positive().optional(),
});

export const reconcileStockSchema = z.object({
  newOnHandQty: z.coerce.number().nonnegative(),
  reason: z.string().min(1, "A reason is required for stock reconciliation"),
});
