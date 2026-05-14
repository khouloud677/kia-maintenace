import { buildKeycloakLoginUrl, KEYCLOAK_STATE_COOKIE } from "@/lib/keycloak";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const state = randomUUID();
    const redirect = NextResponse.redirect(buildKeycloakLoginUrl(state));

    redirect.cookies.set(KEYCLOAK_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });

    return redirect;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Keycloak login is not configured correctly",
      },
      { status: 500 }
    );
  }
}
