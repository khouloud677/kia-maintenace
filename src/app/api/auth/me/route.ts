import { getPrincipalFromToken, KEYCLOAK_ACCESS_COOKIE } from "@/lib/keycloak";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(KEYCLOAK_ACCESS_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const principal = await getPrincipalFromToken(token);
    if (!principal) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: principal });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
