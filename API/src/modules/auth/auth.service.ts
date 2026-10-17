import { Types } from "mongoose";
import { env } from "../../config/env.js";
import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  signAccessToken,
  verifyPassword,
} from "./auth.utils.js";
import { RefreshSessionModel } from "./refreshSession.model.js";
import { LoginInput, RegisterInput } from "./auth.validation.js";
import { UserModel } from "../users/user.model.js";
import { create } from "node:domain";
import { AppError } from "../../shared/errors/AppError.js";

const REFRESH_TOKEN_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

function toAuthUser(user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
}): AuthUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

async function createAuthResult(user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
}): Promise<AuthResult> {
  const refreshToken = generateRefreshToken();

  await RefreshSessionModel.create({
    userId: user._id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    revokedAt: null,
  });
  return {
    user: toAuthUser(user),
    accessToken: signAccessToken(user._id.toString()),
    refreshToken: refreshToken,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    const authResult = await createAuthResult(user);
    return authResult;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(409, "An account with this email already exists");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({
    email: input.email,
  }).select("+passwordHash");

  if (!user) throw new AppError(401, "Invalid username or password");

  const passWordMatches = await verifyPassword(
    user.passwordHash,
    input.password,
  );

  if (!passWordMatches) throw new AppError(401, "Invalid username or password");

  const authResult = await createAuthResult(user);
  return authResult;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(refreshToken);

  const session = await RefreshSessionModel.findOne({
    tokenHash,
  });

  if (!session || session.revokedAt)
    throw new AppError(401, "Invalid refresh token");

  if (session.expiresAt.getTime() <= Date.now())
    throw new AppError(401, "Refresh token has expired");

  const user = await UserModel.findById(session.userId);

  if (!user) throw new AppError(401, "Invalid refresh token");

  const revokedSession = await RefreshSessionModel.updateOne(
    {
      _id: session._id,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );

  if (revokedSession.modifiedCount !== 1)
    throw new AppError(401, "Refresh token is no longer valid");

  const authResult = await createAuthResult(user);
  return authResult;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  await RefreshSessionModel.updateOne(
    {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
}
