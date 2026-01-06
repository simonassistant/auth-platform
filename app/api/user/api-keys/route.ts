import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const userId = auth.userId;
    const { keyType, apiKey } = await req.json();

    if (!keyType || !apiKey) {
      return NextResponse.json({ error: 'Missing keyType or apiKey' }, { status: 400 });
    }

    // Add prefix to the key
    const prefixedKey = `${keyType.toLowerCase()}_${apiKey}`;

    // Fetch existing api_keys
    const users = await sql`SELECT api_keys FROM users WHERE id = ${userId} LIMIT 1`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let currentKeys = users[0].api_keys || {};
    if (typeof currentKeys === 'string') {
      currentKeys = JSON.parse(currentKeys);
    }

    // Update the specific key type
    currentKeys[keyType.toLowerCase()] = prefixedKey;

    // Save back to database
    await sql`UPDATE users SET api_keys = ${JSON.stringify(currentKeys)}::jsonb WHERE id = ${userId}`;

    return NextResponse.json({ message: 'API key updated successfully' });
  } catch (error: any) {
    console.error('API Key update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const userId = auth.userId;

    const users = await sql`SELECT api_keys FROM users WHERE id = ${userId} LIMIT 1`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let currentKeys = users[0].api_keys || {};
    if (typeof currentKeys === 'string') {
      currentKeys = JSON.parse(currentKeys);
    }

    return NextResponse.json({ api_keys: currentKeys });
  } catch (error: any) {
    console.error('API Key fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}