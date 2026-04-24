import { z } from "zod";

// Treat empty string as missing (placeholder envs tetap valid).
const optionalStr = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const schema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_B64: optionalStr,
  GOOGLE_SHEET_ID: optionalStr,
  BLOB_READ_WRITE_TOKEN: optionalStr,
  ALLOWED_EMAIL_DOMAIN: optionalStr,
  ADMIN_EMAILS: optionalStr,
  WORK_START: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("08:00"),
  WORK_END: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("17:00"),
});

export const env = schema.parse(process.env);

export const adminEmails = (env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const allowedDomain = (env.ALLOWED_EMAIL_DOMAIN ?? "").trim().toLowerCase();

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  if (!allowedDomain) return true;
  return email.toLowerCase().endsWith(`@${allowedDomain}`);
}
