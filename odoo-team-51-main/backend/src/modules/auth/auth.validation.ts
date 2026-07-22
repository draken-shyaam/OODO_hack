import { z } from "zod";

export const loginSchema = z.object({
  loginId: z.string().min(1, "Login Id is required"),
  password: z.string().min(1, "Password is required"),
});

// Matches the wireframe's signup rules: Login Id 6-12 chars, password >=8
// chars with upper+lower+special character.
export const signupSchema = z.object({
  loginId: z.string().min(6, "Login Id must be 6-12 characters").max(12, "Login Id must be 6-12 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Login Id or Email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

export const portalLoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const portalSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
