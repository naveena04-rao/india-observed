import { z } from "zod";

const featureFlagSchema = z.enum(["true", "false"]).optional().or(z.literal("")).default("");

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_CONNECTION_CHECK_ENABLED: z.enum(["true", "false"]).default("false"),
  EVENT_FOLLOWING_ENABLED: featureFlagSchema,
  EVENT_FOLLOWING_PRODUCTION_READY: featureFlagSchema,
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

export function getServerEnvironment() {
  return serverSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_CONNECTION_CHECK_ENABLED: process.env.SUPABASE_CONNECTION_CHECK_ENABLED,
    EVENT_FOLLOWING_ENABLED: process.env.EVENT_FOLLOWING_ENABLED,
    EVENT_FOLLOWING_PRODUCTION_READY: process.env.EVENT_FOLLOWING_PRODUCTION_READY,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}
