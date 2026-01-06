import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function verifyAuth() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;

  if (!token) {
    const headerList = await headers();
    const authHeader = headerList.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: decoded.userId };
  } catch (err) {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}
