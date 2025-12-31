/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(req: Request) {
  try {
    const { email, password, tenant_key } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let callback_url: string | null = null;
    if (tenant_key) {
      const tenants = await sql`SELECT callback_url FROM tenants WHERE tenant_key = ${tenant_key} LIMIT 1`;
      if (tenants.length > 0) {
        callback_url = tenants[0].callback_url as string;
      }
    }

    // 1. Fetch user
    const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Return response (optionally setting a cookie)
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email },
      callback_url
    });

    // Example of setting a secure cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
