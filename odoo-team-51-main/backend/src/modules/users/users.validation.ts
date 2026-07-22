import { z } from "zod";

const moduleEnum = z.enum(["sales", "purchase", "manufacturing", "product"]);

export const permissionRowSchema = z.object({
  module: moduleEnum,
  field: z.string().min(1),
  canCreate: z.boolean(),
  canView: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

export const createUserSchema = z.object({
  loginId: z.string().min(6).max(12),
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1),
  position: z.string().optional(),
  isAdmin: z.boolean().optional().default(false),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  mobile: z.string().optional(),
  position: z.string().optional(),
  isAdmin: z.boolean().optional(),
  permissions: z.array(permissionRowSchema).optional(),
});

// Self-service profile update — deliberately excludes email/position, even
// if the client sends them, those fields are simply not in this schema so
// validateRequest strips them before the handler ever sees them.
export const updateMeSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  mobile: z.string().optional(),
});
