import { z } from "zod";

export const createIntelPostSchema = z.object({
  title: z.string().min(3, "Title is required").max(120),
  description: z.string().min(10, "Description is required"),
  postType: z.enum([
    "new_supplier",
    "cheaper_supplier",
    "better_quality",
    "faster_delivery",
    "bulk_discount",
    "local_supplier",
    "alternative_material",
    "excess_stock",
  ]),
  materialName: z.string().min(1, "Material name is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  location: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().positive().optional(),
  contactInfo: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const verifyIntelPostSchema = z.object({
  starsAwarded: z.coerce.number().int().min(0).max(20).default(5),
});
