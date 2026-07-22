import { z } from "zod";

const componentSchema = z.object({
  componentId: z.coerce.number().int().positive(),
  toConsumeQty: z.coerce.number().positive(),
});

const workOrderTemplateSchema = z.object({
  operation: z.string().min(1),
  workCenterId: z.coerce.number().int().positive(),
  expectedDurationMins: z.coerce.number().int().positive(),
});

export const createBomSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  shortReference: z.string().max(8, "Reference must be 8 characters or fewer").optional(),
  components: z.array(componentSchema).min(1, "At least one component is required"),
  workOrderTemplates: z.array(workOrderTemplateSchema).min(1, "At least one operation is required"),
});

// Full-replace semantics: if components/workOrderTemplates are provided,
// they replace the entire existing set rather than being diffed/merged.
export const updateBomSchema = z.object({
  quantity: z.coerce.number().positive().optional(),
  shortReference: z.string().max(8, "Reference must be 8 characters or fewer").optional(),
  components: z.array(componentSchema).optional(),
  workOrderTemplates: z.array(workOrderTemplateSchema).optional(),
});
