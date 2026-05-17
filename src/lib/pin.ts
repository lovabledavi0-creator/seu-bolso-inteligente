// Hashes a PIN using Web Crypto SHA-256 (with user id as salt)
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const PIN_UNLOCKED_KEY = "bsn_pin_unlocked";
