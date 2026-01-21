/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * By logging in, you agree to our Personal Information Collection Statement (PICS).
 */
import { NextRequest, NextResponse } from "next/server";
import { executeQuery, initializeUsersTable } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import redis from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    // Initialize users table if needed
    await initializeUsersTable();

    const { email, password, captchaId, captchaValue } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    if (!captchaId || !captchaValue) {
      return NextResponse.json(
        { error: "CAPTCHA is required" },
        { status: 400 }
      );
    }

    const storedCaptcha = await redis.get(`captcha:${captchaId}`);
    if (!storedCaptcha || storedCaptcha !== captchaValue.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid CAPTCHA" },
        { status: 400 }
      );
    }

    // Delete CAPTCHA after use
    await redis.del(`captcha:${captchaId}`);

    // Find user by email
    const userResult = await executeQuery(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify the password against the stored hash
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
        token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to login" },
      { status: 500 }
    );
  }
}

