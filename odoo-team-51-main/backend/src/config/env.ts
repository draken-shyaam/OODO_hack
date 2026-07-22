import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_INTERNAL_SECRET: z.string().min(1, "JWT_INTERNAL_SECRET is required"),
  JWT_PORTAL_SECRET: z.string().min(1, "JWT_PORTAL_SECRET is required"),
  LLM_NARRATION_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v.toLowerCase() === "true"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  PORT: z.coerce.number().int().positive().default(4000),
  SMTP_USER: z.string().optional().default(""),
  SMTP_APP_PASSWORD: z.string().optional().default(""),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  // Session cookie lifetimes — sliding (idle) window vs. a hard absolute cap
  // enforced regardless of activity. Both optional so existing deployments
  // don't need new env vars to keep working.
  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(30),
  SESSION_ABSOLUTE_TIMEOUT_HOURS: z.coerce.number().int().positive().default(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:");
  // eslint-disable-next-line no-console
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
