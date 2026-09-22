/**
 * Token session ringan yang bisa diverifikasi di Edge Runtime (middleware)
 * maupun di Node. Isinya hanya penanda session, id user, dan role — bukan
 * data sensitif. Tanda tangan HMAC-SHA256 memakai SESSION_SECRET.
 *
 * Middleware memakai token ini untuk gerbang route (cepat, tanpa database),
 * sementara setiap halaman & API tetap memverifikasi ulang ke tabel Session
 * supaya logout dan pencabutan akses benar-benar berlaku.
 */

export const SESSION_COOKIE = 'kosku_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 hari

export type TokenPayload = {
  sid: string;
  uid: string;
  role: 'ADMIN' | 'TENANT';
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      'SESSION_SECRET belum diatur atau terlalu pendek (minimal 16 karakter). Cek file .env.',
    );
  }
  return value;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyToken(token: string | undefined): Promise<TokenPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (!body || !signature) return null;

  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;

    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as TokenPayload;
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) return null;
    if (parsed.role !== 'ADMIN' && parsed.role !== 'TENANT') return null;
    if (typeof parsed.sid !== 'string' || typeof parsed.uid !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
