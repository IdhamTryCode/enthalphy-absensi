import { google } from "googleapis";
import { env } from "./env";

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

function getServiceAccountKey(): ServiceAccountKey {
  if (!env.GOOGLE_SERVICE_ACCOUNT_B64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_B64 is not set");
  }
  const decoded = Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_B64, "base64").toString(
    "utf8",
  );
  const parsed = JSON.parse(decoded) as ServiceAccountKey;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Invalid service account JSON: missing client_email or private_key");
  }
  return parsed;
}

export function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;
  const key = getServiceAccountKey();
  cachedAuth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return cachedAuth;
}

export function getSheets() {
  return google.sheets({ version: "v4", auth: getGoogleAuth() });
}

export function getServiceAccountEmail(): string {
  return getServiceAccountKey().client_email;
}
