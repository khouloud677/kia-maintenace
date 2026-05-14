import { KEYCLOAK_ACCESS_COOKIE, KEYCLOAK_STATE_COOKIE } from "@/lib/keycloak";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const issuer = process.env.KEYCLOAK_ISSUER_URL ?? process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const postLogoutRedirectUri = new URL("/login?auth=logged_out", request.nextUrl.origin);

  let target = postLogoutRedirectUri;

  if (issuer && clientId) {
    const issuerUrl = issuer.endsWith("/") ? issuer.slice(0, -1) : issuer;
    const keycloakLogoutUrl = new URL(`${issuerUrl}/protocol/openid-connect/logout`);
    keycloakLogoutUrl.searchParams.set("client_id", clientId);
    keycloakLogoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri.toString());
    target = keycloakLogoutUrl;
  }

  const redirect = NextResponse.redirect(target);

  redirect.cookies.set(KEYCLOAK_ACCESS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  redirect.cookies.set(KEYCLOAK_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return redirect;
}
