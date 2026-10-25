import { env } from "../../config/env.js";
import ms from "ms";
import type { Request, Response, NextFunction } from "express";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./auth.validation.js";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "./auth.service.js";
import { AppError } from "../../shared/errors/AppError.js";
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const accessCookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME,
  path: "/",
};

const refreshCookieOptions = {
  ...accessCookieOptions,
  path: "/api/auth",
};

const refreshCookieMaxAge = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...accessCookieOptions,
    maxAge: ms(env.ACCESS_TOKEN_TTL as ms.StringValue),
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...refreshCookieOptions,
    maxAge: refreshCookieMaxAge,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions);
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    refreshSchema.parse(req.body);
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (typeof refreshToken !== "string" || !refreshToken)
      throw new AppError(401, "Refresh token is missing");

    const result = await refreshAccessToken(refreshToken);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];

    if (typeof refreshToken === "string" && refreshToken)
      await logoutUser(refreshToken);

    clearAuthCookies(res);

    res.status(200).send();
  } catch (error) {
    next(error);
  }
}
