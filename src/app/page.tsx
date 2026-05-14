import Link from "next/link";
import { cookies } from "next/headers";
import { getPrincipalFromToken, KEYCLOAK_ACCESS_COOKIE } from "@/lib/keycloak";

const stats = [
  { label: "Satisfaction Rate", value: "99.8%", icon: "verified" },
  { label: "Clients Served", value: "50,000+", icon: "groups" },
  { label: "Monthly Visits", value: "12,000+", icon: "bolt" },
];

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const authStatus = Array.isArray(params.auth) ? params.auth[0] : params.auth;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(KEYCLOAK_ACCESS_COOKIE)?.value;
  const principal = accessToken ? await getPrincipalFromToken(accessToken) : null;

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full bg-[#0d141c]/60 shadow-[0_40px_40px_-15px_rgba(166,200,255,0.05)] backdrop-blur-[24px]">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-8 py-4">
          <div className="font-headline text-lg font-bold tracking-[0.2em] text-white">KIA VELOCITY PULSE</div>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              className="relative font-headline font-bold tracking-tight text-[#a6c8ff] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-[#a6c8ff]"
              href="/"
            >
              Home
            </Link>
            <Link
              className="rounded-md px-2 py-1 font-headline font-bold tracking-tight text-[#c1c6d3] transition-all duration-300 hover:bg-[#242a33]/50 hover:text-white"
              href="/book"
            >
              Services
            </Link>
            <Link
              className="rounded-md px-2 py-1 font-headline font-bold tracking-tight text-[#c1c6d3] transition-all duration-300 hover:bg-[#242a33]/50 hover:text-white"
              href="/faq"
            >
              Agencies
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/track"
              className="hidden px-4 py-2 font-headline font-bold tracking-tight text-[#c1c6d3] transition-all hover:text-white lg:block"
            >
              Track
            </Link>
            {principal ? (
              <>
                <Link
                  href="/book"
                  className="blue-gradient rounded-md px-6 py-2 font-headline font-bold tracking-tight text-on-primary transition-transform active:scale-[0.97]"
                >
                  Book Now
                </Link>
                <a
                  href="/api/auth/keycloak/logout"
                  className="rounded-md border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold tracking-wider text-rose-200 transition-colors hover:bg-rose-400/20"
                >
                  Logout
                </a>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      {principal ? (
        <p className="mx-8 mt-6 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200">
          Signed in as {principal.preferred_username ?? principal.email ?? principal.sub}
        </p>
      ) : null}

      {authStatus === "success" ? (
        <p className="mx-8 mt-6 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
          Keycloak login successful. Your session is active.
        </p>
      ) : null}
      {authStatus === "state_error" || authStatus === "token_error" ? (
        <p className="mx-8 mt-6 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          Keycloak authentication failed. Please try again.
        </p>
      ) : null}

      <main>
        <section className="relative flex min-h-[921px] items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Kia EV6 GT"
              className="h-full w-full object-cover opacity-60"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf1RwJ-Z_yL0ohd928q858i5lD86vu9_Gf7geY7vyfIiDrD82ob9NsasTluMjzc6XaGSNKhYeIMQ-F-cMbHqOqMhgSjgAKszhLpcwyA81whoV-KIM9khIa1WjqzT8hCw_0sJDIgDSZFbjbQY9rxCGXbGEAOT7R1q2jSq5vc8ZdC7w8qcr04yhsu2-6vdtrN-m46otwCdgzt2okz8WxJt2-kC8qF0nPJIrQ9YnKiqvAa8yFyeek3Swg0f3oq702LRCJU8FL3EnC7m0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          </div>

          <div className="container relative z-10 mx-auto grid items-center gap-12 px-8 lg:grid-cols-2">
            <div className="max-w-2xl">
              <h1 className="mb-6 font-headline text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
                Book your Kia maintenance in <span className="italic text-primary">minutes</span>.
              </h1>
              <p className="mb-10 max-w-xl font-body text-xl leading-relaxed text-on-surface-variant">
                Speed-first booking for your luxury driving experience. Precision engineering meets
                seamless digital convenience.
              </p>
              <div className="flex flex-col gap-6 sm:flex-row">
                <Link
                  href="/book"
                  className="blue-gradient rounded-md px-10 py-5 text-center font-label text-sm font-bold uppercase tracking-widest text-on-primary shadow-[0_20px_40px_rgba(0,91,170,0.3)] transition-all active:scale-95"
                >
                  Start Booking
                </Link>
                {principal ? (
                  <a
                    href="/api/auth/keycloak/logout"
                    className="rounded-md border border-rose-300/30 bg-rose-400/10 px-10 py-5 text-center font-label text-sm font-bold uppercase tracking-widest text-rose-200 transition-colors hover:bg-rose-400/20"
                  >
                    Logout
                  </a>
                ) : null}
                <Link
                  href="/track"
                  className="rounded-md border-2 border-outline-variant/30 px-10 py-5 text-center font-label text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-surface-container-high active:scale-95"
                >
                  Track My Appointment
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-12">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-6 border-r border-outline-variant/10 px-8 last:border-0"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <div className="font-headline text-2xl font-bold tracking-tight text-white">{item.value}</div>
                    <div className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden py-24">
          <div className="container mx-auto px-8">
            <div className="flex flex-col items-center gap-16 lg:flex-row">
              <div className="relative w-full lg:w-1/2">
                <div className="absolute left-[-20%] top-1/2 h-[120%] w-[120%] -translate-y-1/2 rounded-full bg-primary-container/10 blur-[120px]" />
                <img
                  alt="Service Bay"
                  className="relative z-10 rounded-xl shadow-2xl grayscale transition-all duration-700 hover:grayscale-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuL7dM-LJFB2BYiMZL1eg3Sf0Hss_4hLCzIp878KHmZr59jGw7vMFhVNpQyeWMrFJvo9KsUvLh3FccyrNJL5noe8i1QQKUFyHKE6CA1TrSl65-KEtEnQPHwibLMKRFlg4MvOnbeBDZWRNTG1ET6Kj6pTVGqZO_nP40TG0xW3Sr3PNi9t6eH9U4eMmqwj7VDgDVwjxoApcI9vbQffEIvheqwiX1ldAJw60FdwIErSqU7Cz7IbeHdP_1gp9NEhYX4dSGnpP-Uepkcf0"
                />
              </div>

              <div className="w-full lg:w-1/2">
                <span className="mb-4 block text-xs font-bold uppercase tracking-[0.4em] text-primary">The Kinetic Standard</span>
                <h2 className="mb-8 font-headline text-4xl font-bold leading-tight text-white md:text-5xl">
                  Uncompromising service for <br />
                  uncompromising performance.
                </h2>

                <div className="space-y-8">
                  <div className="group flex gap-6">
                    <span className="material-symbols-outlined text-3xl text-primary transition-transform group-hover:scale-110">speed</span>
                    <div>
                      <h4 className="mb-2 font-headline text-xl font-semibold text-white">Express Diagnostics</h4>
                      <p className="text-on-surface-variant">
                        Real-time cloud connected diagnostics that predict maintenance needs before
                        they become issues.
                      </p>
                    </div>
                  </div>

                  <div className="group flex gap-6">
                    <span className="material-symbols-outlined text-3xl text-primary transition-transform group-hover:scale-110">precision_manufacturing</span>
                    <div>
                      <h4 className="mb-2 font-headline text-xl font-semibold text-white">Certified Specialists</h4>
                      <p className="text-on-surface-variant">
                        Every technician is factory-trained to master the intricate systems of your
                        high-performance vehicle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#414751]/20 bg-[#0d141c] px-8 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="font-headline font-black tracking-widest text-white">KIA VELOCITY PULSE</div>
          <div className="flex gap-8">
            <Link className="text-sm tracking-wide text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Privacy
            </Link>
            <Link className="text-sm tracking-wide text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Contact
            </Link>
            <Link className="text-sm tracking-wide text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Agency Locator
            </Link>
          </div>
          <div className="text-sm tracking-wide text-[#c1c6d3]">© 2024 KIA VELOCITY PULSE. KINETIC ATELIER.</div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-[#414751]/15 bg-[#0d141c]/80 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-[20px] md:hidden">
        <Link
          className="flex scale-110 flex-col items-center justify-center rounded-xl bg-[#242a33] px-4 py-1 text-[#a6c8ff] transition-transform"
          href="/"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-all duration-200 hover:opacity-100 active:scale-90" href="/faq">
          <span className="material-symbols-outlined">directions_car</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">My Cars</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-all duration-200 hover:opacity-100 active:scale-90" href="/book">
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Book</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-all duration-200 hover:opacity-100 active:scale-90" href="/track">
          <span className="material-symbols-outlined">notifications</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Alerts</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-all duration-200 hover:opacity-100 active:scale-90" href="/account">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Profile</span>
        </Link>
        {principal ? (
          <a className="flex flex-col items-center justify-center text-rose-200 transition-all duration-200 hover:text-rose-100 active:scale-90" href="/api/auth/keycloak/logout">
            <span className="material-symbols-outlined">logout</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Logout</span>
          </a>
        ) : null}
      </nav>
    </>
  );
}
