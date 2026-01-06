import { sql } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cleanupAuthCodes } from '@/app/utils/oauth_helpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, client_id, client_secret } = body;

    if (!code || !client_id || !client_secret) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters: code, client_id, client_secret' },
        { status: 400 }
      );
    }

    // 0. Cleanup expired or used codes
    await cleanupAuthCodes();

    // 1. Validate client credentials
    const clients = await sql`
      SELECT id, client_secret 
      FROM client_info 
      WHERE client_id = ${client_id} 
      LIMIT 1
    `;

    if (clients.length === 0 || clients[0].client_secret !== client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401 }
      );
    }

    const client = clients[0];

    // 2. Validate authorization code
    const authCodes = await sql`
      SELECT client_id, user_id, expires_at, used 
      FROM auth_codes 
      WHERE code = ${code} 
      LIMIT 1
    `;

    if (authCodes.length === 0) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        { status: 400 }
      );
    }

    const authCode = authCodes[0];
    const now = new Date();

    // Ensure we're comparing UTC times to avoid timezone-related "always expired" issues

    // The database driver returns TIMESTAMPTZ as a Date object.
    const expiresAt = authCode.expires_at instanceof Date
      ? authCode.expires_at
      : new Date(authCode.expires_at as string);


    const isExpired = now.getTime() > expiresAt.getTime();

    if (authCode.used === true || isExpired) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code has expired or already used' },
        { status: 400 }
      );
    }

    console.log('Client ID check:', {
      authCodeClientId: authCode.client_id,
      resolvedClientId: client.id
    });

    const userId = authCode.user_id;

    // 3. Fetch user details
    const users = await sql`
      SELECT id, email 
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'User not found' },
        { status: 400 }
      );
    }

    const user = users[0];

    // 4. Delete the authorization code (it has been verified and used)
    await sql`
      DELETE FROM auth_codes 
      WHERE code = ${code}
    `;

  
    // 5. Generate access token (JWT)
    const payload = {
      userId: user.id,
      email: user.email,
      aud: client_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 5, // 5 days
    };

    const access_token = jwt.sign(payload, process.env.JWT_SECRET!, { algorithm: 'HS256' });

    // 6. Respond with token
    return NextResponse.json({
      access_token,
      token_type: 'Bearer',
      expires_in: '5d',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}
