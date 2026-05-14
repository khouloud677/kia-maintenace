import Link from "next/link";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const authStatus = Array.isArray(params.auth) ? params.auth[0] : params.auth;

  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 z-0 h-[353px] w-full overflow-hidden">
        <img
          className="h-full w-full object-cover opacity-40"
          alt="Close-up of a high-performance Kia EV6 headlight at night"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDexXhz4_lhycNOCbnTDMLfK4ljsQMc2k8YRmSP5IUdkF9qbg74-CvY_zl0y9EYce_iEmdD4CJVogbhHk_sQaGm41ZgjebsTBMtmyILuM7_kluRewSMDIGX4RIZXZB00ThlYT1LRboQcODKZ1HyKvt3wd-JnMtU9N9w5lszE4iYZ-m4Fu_-mrMY6YWBzl6YL66VVrWnmZTG6kshflo0CSxUu7hgzTB9I9Nf97SiNHez909mMFwWOTfB38L3ReWVrl9tg1n-j0hgvfA"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-1 flex-col overflow-hidden px-8 pb-12 pt-20">
        <header className="mb-12">
          <h1 className="mb-1 font-headline text-5xl font-extrabold leading-none tracking-tight text-primary">
            VELOCITY
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-12 bg-primary" />
            <p className="font-headline text-lg font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              PULSE
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <div className="mb-8 rounded-md border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
            Secure login with Keycloak
          </div>

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

          <div className="mb-10 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              This project uses Keycloak for one unified sign-in. Press the button below to continue.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              className="rounded-xl bg-gradient-to-br from-[#005baa] to-[#a6c8ff] py-5 text-center font-headline text-sm font-bold uppercase tracking-[0.15em] text-on-primary shadow-[0_10px_30px_rgba(0,91,170,0.3)] transition-all active:scale-[0.98]"
              href="/api/auth/keycloak/login"
            >
              Continue with Keycloak
            </Link>

            <p className="text-center text-xs uppercase tracking-[0.2em] text-on-surface-variant/60">
              Guest booking uses its own OTP flow after you start a reservation.
            </p>
          </div>
        </div>

        <footer className="mt-auto text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-on-surface-variant/40">
            Engineered for Excellence • © 2024 Kia Global
          </p>
        </footer>
      </main>

      <div className="pointer-events-none fixed -right-20 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      <div className="pointer-events-none fixed -left-20 bottom-0 h-96 w-96 rounded-full bg-secondary-container/10 blur-[120px]" />

      <div className="pointer-events-none fixed left-0 top-0 h-full w-full overflow-hidden opacity-10">
        <div className="absolute left-0 top-[15%] h-[1px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute left-0 top-[45%] h-[1px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute left-0 top-[75%] h-[1px] w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    </>
  );
}
