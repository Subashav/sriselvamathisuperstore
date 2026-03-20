import type { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export const setAuthCookies = (response: NextResponse, accessToken: string, refreshToken: string) => {
  response.cookies.set("tn_access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  response.cookies.set("tn_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
};

export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set("tn_access_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  response.cookies.set("tn_refresh_token", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
};
