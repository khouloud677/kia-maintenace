import {
  exchangeKeycloakCode,
  KEYCLOAK_ACCESS_COOKIE,
  KEYCLOAK_STATE_COOKIE,
} from "@/lib/keycloak";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(KEYCLOAK_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || expectedState !== state) {
    return NextResponse.redirect(new URL("/login?auth=state_error", url.origin));
  }

  try {
    const token = await exchangeKeycloakCode(code);
    const redirect = NextResponse.redirect(new URL("/?auth=success", url.origin));

    redirect.cookies.set(KEYCLOAK_ACCESS_COOKIE, token.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.max(60, token.expires_in),
    });

    redirect.cookies.set(KEYCLOAK_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return redirect;
  } catch {
    return NextResponse.redirect(new URL("/login?auth=token_error", url.origin));
  }
}
