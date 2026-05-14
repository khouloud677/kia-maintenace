import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { NextRequest } from "next/server";

const keycloakIssuer =
  process.env.KEYCLOAK_ISSUER_URL ?? process.env.KEYCLOAK_ISSUER;
const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID;
const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
const keycloakWebRedirectUri = process.env.KEYCLOAK_WEB_REDIRECT_URI;
const keycloakAudience = process.env.KEYCLOAK_AUDIENCE ?? keycloakClientId;

function normalizeIssuer(issuer: string) {
  return issuer.endsWith("/") ? issuer.slice(0, -1) : issuer;
}

const normalizedIssuer = keycloakIssuer ? normalizeIssuer(keycloakIssuer) : null;

export const KEYCLOAK_ACCESS_COOKIE = "kc_access_token";
export const KEYCLOAK_STATE_COOKIE = "kc_oauth_state";

const jwks =
  normalizedIssuer != null
    ? createRemoteJWKSet(new URL(`${normalizedIssuer}/protocol/openid-connect/certs`))
    : null;

export type MobilePrincipal = {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

function getSessionCookieToken(request: NextRequest) {
  return request.cookies.get(KEYCLOAK_ACCESS_COOKIE)?.value ?? null;
}

export async function getPrincipalFromToken(token: string): Promise<MobilePrincipal | null> {
  if (!token) {
    return null;
  }

  if (!jwks || !keycloakAudience || !keycloakIssuer) {
    return null;
  }

  try {
    const result = await jwtVerify(token, jwks, {
      issuer: normalizedIssuer,
      audience: keycloakAudience,
    });

    return mapPayload(result.payload);
  } catch {
    return null;
  }
}

export async function requireMobileUser(request: NextRequest): Promise<MobilePrincipal | null> {
  const token = getBearerToken(request) ?? getSessionCookieToken(request);

  if (!token) {
    return null;
  }

  if (!jwks || !keycloakAudience || !keycloakIssuer) {
    // Dev fallback to ease local testing when Keycloak is not configured.
    const devUser = request.headers.get("x-dev-user");
    if (!devUser) {
      return null;
    }
    return { sub: devUser };
  }

  return getPrincipalFromToken(token);
}

function getRequiredWebConfig() {
  if (!normalizedIssuer || !keycloakClientId || !keycloakWebRedirectUri) {
    throw new Error("Missing Keycloak web configuration");
  }

  return {
    issuer: normalizedIssuer,
    clientId: keycloakClientId,
    clientSecret: keycloakClientSecret,
    redirectUri: keycloakWebRedirectUri,
  };
}

export function buildKeycloakLoginUrl(state: string) {
  const config = getRequiredWebConfig();
  const url = new URL(`${config.issuer}/protocol/openid-connect/auth`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  expires_in: number;
};

export async function exchangeKeycloakCode(code: string): Promise<TokenResponse> {
  const config = getRequiredWebConfig();
  const tokenUrl = new URL(`${config.issuer}/protocol/openid-connect/token`);
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", config.clientId);
  body.set("redirect_uri", config.redirectUri);

  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak token exchange failed: ${text}`);
  }

  const payload = (await response.json()) as Partial<TokenResponse>;
  if (!payload.access_token || !payload.expires_in) {
    throw new Error("Keycloak token payload is invalid");
  }

  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in,
  };
}

function mapPayload(payload: JWTPayload): MobilePrincipal {
  return {
    sub: String(payload.sub),
    email: payload.email ? String(payload.email) : undefined,
    preferred_username: payload.preferred_username
      ? String(payload.preferred_username)
      : undefined,
    name: payload.name ? String(payload.name) : undefined,
  };
}
