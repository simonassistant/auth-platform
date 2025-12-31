import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { validateClient, generateAndStoreAuthCode, cleanupAuthCodes } from '@/app/utils/oauth_helpers';

export async function POST(req: Request) {
  try {
    const { email, password, client_id: clientIdParam, redirect_uri, state } = await req.json();

    if (!email || !password || !clientIdParam || !redirect_uri) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 0. Cleanup expired or used codes
    await cleanupAuthCodes();

    // 1. Validate Client
    const client = await validateClient(clientIdParam, redirect_uri);

    if (!client) {
      return NextResponse.json({ error: 'Invalid client_id or redirect_uri' }, { status: 400 });
    }

    // 2. Validate User
    const users = await sql`
      SELECT id, password 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Generate and Store Authorization Code
    const authCode = await generateAndStoreAuthCode(client.id, user.id);

    // 4. Construct Redirect URL
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('code', authCode);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    return NextResponse.json({
      message: 'Login successful',
      redirect_url: callbackUrl.toString()
    });

  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
