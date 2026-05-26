import crypto from "crypto";

const ownerPin = process.env.OWNER_PIN ?? "";
const sessionSecret = process.env.SESSION_SECRET ?? ownerPin;

export function verifyOwnerPin(pin: string | null | undefined) {
  if (!ownerPin) return false;
  return pin === ownerPin;
}

export function createSessionToken() {
  if (!ownerPin) return "";
  return crypto.createHmac("sha256", sessionSecret).update(ownerPin).digest("base64");
}

export function verifySessionToken(token: string | null | undefined) {
  if (!token || !ownerPin) return false;
  const expected = createSessionToken();
  return token === expected;
}

export function parseCookies(cookieHeader: string | null | undefined) {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export function verifyOwnerRequest(request: Request) {
  // Accept header x-owner-pin for backward compatibility
  const headerPin = request.headers.get("x-owner-pin");
  if (headerPin && verifyOwnerPin(headerPin)) return true;

  // Check cookie
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const token = cookies["owner-auth"];
  return verifySessionToken(token);
}