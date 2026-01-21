import { NextRequest, NextResponse } from "next/server";
import { executeQuery, initializeUsersTable } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import redis from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    // Initialize users table if needed
    await initializeUsersTable();

  
    const { name, email, password, confirmPassword, captchaId, captchaValue } = await request.json();

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Name, email, password, and password confirmation are required" },
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

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserResult = await executeQuery(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUserResult.rows && existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password before storing it
    const hashedPassword = await hashPassword(password);
    
    const insertResult = await executeQuery(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    // Get the created user (excluding password)
    const newUserResult = await executeQuery(
      "SELECT id, name, email, created_at FROM users WHERE id = ?",
      [insertResult.lastInsertRowid]
    );

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: newUserResult.rows && newUserResult.rows.length > 0 ? newUserResult.rows[0] : null
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

