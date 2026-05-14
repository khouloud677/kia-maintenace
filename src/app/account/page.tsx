import Link from "next/link";
import { cookies } from "next/headers";
import { getPrincipalFromToken, KEYCLOAK_ACCESS_COOKIE } from "@/lib/keycloak";

type AccountPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = (await searchParams) ?? {};
  const authStatus = Array.isArray(params.auth) ? params.auth[0] : params.auth;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(KEYCLOAK_ACCESS_COOKIE)?.value;
  const principal = accessToken ? await getPrincipalFromToken(accessToken) : null;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-background px-6 py-10 text-on-surface sm:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-outline-variant/30 bg-surface-container-low/80 p-8 shadow-2xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-white">Account</h1>
          <Link
            href="/"
            className="rounded-md border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Back to home
          </Link>
        </div>

        {authStatus === "success" ? (
          <p className="mb-6 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            Keycloak login successful. Your session is active.
          </p>
        ) : null}

        {authStatus === "logged_out" ? (
          <p className="mb-6 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            You have been logged out successfully.
          </p>
        ) : null}

        {authStatus === "state_error" || authStatus === "token_error" ? (
          <p className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            Keycloak authentication failed. Please try again.
          </p>
        ) : null}

        {principal ? (
          <section className="space-y-5">
            <p className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200">
              Signed in as {principal.preferred_username ?? principal.email ?? principal.sub}
            </p>

            <div className="grid gap-3 rounded-lg border border-outline-variant/25 bg-surface-container p-4 text-sm">
              <p>
                <span className="font-semibold text-white">ID:</span> {principal.sub}
              </p>
              {principal.name ? (
                <p>
                  <span className="font-semibold text-white">Name:</span> {principal.name}
                </p>
              ) : null}
              {principal.email ? (
                <p>
                  <span className="font-semibold text-white">Email:</span> {principal.email}
                </p>
              ) : null}
              {principal.preferred_username ? (
                <p>
                  <span className="font-semibold text-white">Username:</span> {principal.preferred_username}
                </p>
              ) : null}
            </div>

            <a
              href="/api/auth/keycloak/logout"
              className="inline-flex rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold tracking-wide text-rose-200 transition-colors hover:bg-rose-400/20"
            >
              Log out from Keycloak
            </a>
          </section>
        ) : (
          <section className="space-y-5">
            <p className="rounded-md border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200">
              You are not signed in.
            </p>

            <a
              href="/api/auth/keycloak/login"
              className="inline-flex rounded-md border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold tracking-wide text-primary transition-colors hover:bg-primary/20"
            >
              Sign in with Keycloak
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
