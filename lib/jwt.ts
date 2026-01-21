import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";

const secretKey = process.env.JWT_SECRET;
const secret = new TextEncoder().encode(secretKey);

export interface UserJWTPayload extends JoseJWTPayload {
  userId: number;
  email: string;
  name: string;
}

/**
 * Sign a JWT token with user information
 */
export async function signToken(payload: { userId: number; email: string; name: string }): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token expires in 7 days
    .sign(secret);

  return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<UserJWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJWTPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

