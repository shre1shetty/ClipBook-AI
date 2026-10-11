import argon2 from "argon2";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { createHash, randomBytes } from "node:crypto";
export interface AccessTokenPayload {
  sub: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export function signAccessToken(userId: string): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
    issuer: "clibook-main-api",
    audience: "clipbook-client",
  };

  return jwt.sign({}, env.ACCESS_TOKEN_SECRET, options);
}

export function veirifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET, {
    issuer: "clibook-main-api",
    audience: "clipbook-client",
  });

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token payload");
  }
  return { sub: payload.sub };
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
