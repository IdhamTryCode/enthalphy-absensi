import { z } from "zod";

const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const hhmm = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Format harus HH:mm");

const schema = z
  .object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    // Database (Supabase Postgres direct, untuk Drizzle)
    DATABASE_URL: z.string().min(1),

    // Storage foto
    BLOB_READ_WRITE_TOKEN: optionalStr,

    // Domain restriction (opsional)
    ALLOWED_EMAIL_DOMAIN: optionalStr,

    // Jam kerja standar (WIB)
    WORK_START: hhmm.default("08:00"),
    WORK_END: hhmm.default("17:00"),

    // Vercel auto-injected
    VERCEL_OIDC_TOKEN: optionalStr,
    CRON_SECRET: optionalStr,
  })
  .superRefine((env, ctx) => {
    const toMinutes = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMinutes(env.WORK_START) >= toMinutes(env.WORK_END)) {
      ctx.addIssue({
        code: "custom",
        message: "WORK_START harus lebih awal dari WORK_END",
        path: ["WORK_END"],
      });
    }
  });

export const env = schema.parse(process.env);

export const allowedDomain = (env.ALLOWED_EMAIL_DOMAIN ?? "").trim().toLowerCase();

export function isEmailDomainAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!allowedDomain) return true;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}
