import { sql } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export async function validateClient(clientId: string, redirectUri: string) {
  const clients = await sql`
    SELECT id, redirect_urls 
    FROM client_info 
    WHERE client_id = ${clientId} 
    LIMIT 1
  `;

  if (clients.length === 0) return null;

  const client = clients[0];
  const allowedRedirects = client.redirect_urls;

  let isRedirectAllowed = false;
  if (Array.isArray(allowedRedirects)) {
    isRedirectAllowed = allowedRedirects.includes(redirectUri);
  } else if (typeof allowedRedirects === 'string') {
    try {
      const parsed = JSON.parse(allowedRedirects);
      if (Array.isArray(parsed)) {
        isRedirectAllowed = parsed.includes(redirectUri);
      } else {
        isRedirectAllowed = parsed === redirectUri;
      }
    } catch {
      isRedirectAllowed = allowedRedirects === redirectUri;
    }
  }

  return isRedirectAllowed ? client : null;
}

export async function generateAndStoreAuthCode(clientIdUuid: string, userId: number) {
  const code = randomUUID();
  
  await sql`
    INSERT INTO auth_codes (code, client_id, user_id, used)
    VALUES (${code}, ${clientIdUuid}, ${userId}, false)
  `;
  return code;
}

export async function cleanupAuthCodes() {
  await sql`
    DELETE FROM auth_codes 
    WHERE used = true OR expires_at < CURRENT_TIMESTAMP
  `;
}