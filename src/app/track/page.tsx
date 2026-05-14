"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type TrackResult = {
  reference: string;
  status: "PENDING" | "IN_PROGRESS" | "READY" | "CANCELLED";
  scheduledAt: string;
  service: string;
  agency: string;
  city: string;
  vin: string;
  matricule: string | null;
};

function statusClass(status: TrackResult["status"]) {
  if (status === "READY") return "bg-emerald-500/20 text-emerald-200 border border-emerald-400/25";
  if (status === "IN_PROGRESS") return "bg-primary/20 text-primary border border-primary/25";
  if (status === "CANCELLED") return "bg-red-500/20 text-red-200 border border-red-400/25";
  return "bg-surface-container-high text-on-surface-variant border border-outline-variant/40";
}

function statusLabel(status: TrackResult["status"]) {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "READY") return "Ready for Pickup";
  if (status === "CANCELLED") return "Cancelled";
  return "Pending Arrival";
}

export default function TrackPage() {
  const [reference, setReference] = useState("");
  const [vin, setVin] = useState("");
  const [matricule, setMatricule] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setPending(true);

    try {
      const query = new URLSearchParams();
      if (reference) {
        query.set("reference", reference);
      } else {
        if (vin) query.set("vin", vin);
        if (matricule) query.set("matricule", matricule);
      }

      const response = await fetch(`/api/appointments/track?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Appointment not found");
      }

      setResult(data as TrackResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to track RDV");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-[100] w-full bg-[#0d141c]/60 shadow-[0_40px_40px_-15px_rgba(166,200,255,0.05)] backdrop-blur-[24px]">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-8 py-4">
          <div className="font-headline text-lg font-bold tracking-[0.2em] text-white">KIA VELOCITY PULSE</div>
          <div className="hidden items-center space-x-8 font-headline font-bold tracking-tight md:flex">
            <Link className="rounded-md px-3 py-1 text-[#c1c6d3] transition-all duration-300 hover:bg-[#242a33]/50 hover:text-white" href="/">
              Home
            </Link>
            <Link className="rounded-md px-3 py-1 text-[#c1c6d3] transition-all duration-300 hover:bg-[#242a33]/50 hover:text-white" href="/book">
              Services
            </Link>
            <Link className="rounded-md px-3 py-1 text-[#c1c6d3] transition-all duration-300 hover:bg-[#242a33]/50 hover:text-white" href="/faq">
              Agencies
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden px-4 py-2 font-headline text-sm font-bold tracking-tight text-[#c1c6d3] lg:block">Track</span>
            <Link
              href="/book"
              className="gradient-primary rounded-md px-6 py-2.5 font-label text-xs font-bold uppercase tracking-widest text-on-primary shadow-lg shadow-primary-container/20 transition-transform active:scale-[0.97]"
            >
              Book Now
            </Link>
            <span className="material-symbols-outlined cursor-pointer text-[#a6c8ff]">account_circle</span>
          </div>
        </div>
      </nav>

      <main className="min-h-screen pb-24">
        <section className="relative overflow-hidden px-8 py-20">
          <div className="absolute inset-0 z-0">
            <img
              alt=""
              className="h-full w-full object-cover opacity-20 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8UULlBg4HfT5TFmG3pMwzllRgBlcUUhq981bSKQU3QlQWtyl9QTvXg2HHFYDzhAwFjrjvgNj7TPKW-xm2t7V2soYm7-CnrN30aRpSrFc6IgeSi_CzrkkV7rJXMM6oDb-wjRfZi-6UAinlvw6PGpbGXsIgEwF8g1bADpJM_0l5uhvJPCOMdtpfhCGVrvyXa7v5ix1eAl1ntBuOSBGj75DseDaQkda7DzixfJ10l8O91xBkQZqAOHW5iT5YtvV8JxG-EN04DTU9SvE"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface via-transparent to-surface" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl">
            <h1 className="mb-4 font-headline text-5xl font-bold tracking-tighter text-white md:text-7xl">
              LIVE TRACKING
            </h1>
            <p className="mb-12 max-w-xl text-lg text-on-surface-variant">
              Enter your vehicle details or appointment number to monitor your service in real-time.
            </p>

            <form
              onSubmit={onSubmit}
              className="grid grid-cols-1 gap-6 rounded-xl border-l-4 border-primary bg-surface-container-low p-8 shadow-2xl md:grid-cols-2"
            >
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
                  License Plate + VIN
                </label>
                <input
                  className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest py-4 text-white placeholder:text-outline transition-all focus:border-primary focus:ring-0"
                  placeholder="e.g. ABC-1234 / 17-DIGIT-VIN"
                  value={`${matricule}${matricule && vin ? " / " : ""}${vin}`}
                  onChange={(event) => {
                    const input = event.target.value.toUpperCase();
                    const splitBySlash = input.split("/");
                    if (splitBySlash.length > 1) {
                      setMatricule(splitBySlash[0].trim());
                      setVin(splitBySlash.slice(1).join("/").trim().replaceAll(" ", ""));
                      return;
                    }
                    const compact = input.replaceAll(" ", "");
                    if (compact.length === 17) {
                      setVin(compact);
                      return;
                    }
                    setMatricule(input.trim());
                    setVin("");
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
                  Appointment Number
                </label>
                <input
                  className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest py-4 text-white placeholder:text-outline transition-all focus:border-primary focus:ring-0"
                  placeholder="e.g. KIA-XP-90210"
                  value={reference}
                  onChange={(event) => setReference(event.target.value.toUpperCase())}
                />
              </div>

              <div className="pt-4 md:col-span-2">
                <button
                  type="submit"
                  disabled={pending || (!reference && !vin && !matricule)}
                  className="gradient-primary w-full rounded-md px-12 py-4 font-label text-sm font-bold uppercase tracking-widest text-on-primary shadow-xl shadow-primary/10 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 md:w-auto"
                >
                  {pending ? "Tracking..." : "Track Service"}
                </button>
              </div>

              {error ? (
                <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 md:col-span-2">
                  {error}
                </p>
              ) : null}
            </form>
          </div>
        </section>

        <section className="relative z-20 mx-auto -mt-10 max-w-7xl px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-4">
              <div className="rounded-xl border-t border-white/5 bg-surface-container-high p-8 shadow-2xl">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h2 className="mb-1 font-headline text-2xl font-bold text-white">
                      {result ? result.service : "EV6 GT-LINE"}
                    </h2>
                    <span className="rounded bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {result ? result.reference : "LX-4402-KP"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <span className="material-symbols-outlined text-primary">electric_car</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                    <span className="text-sm text-on-surface-variant">Service Type</span>
                    <span className="font-semibold text-white">{result?.service ?? "15,000mi Inspection"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
                    <span className="text-sm text-on-surface-variant">Status</span>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${statusClass(result?.status ?? "PENDING")}`}
                    >
                      <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                      {statusLabel(result?.status ?? "PENDING")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-on-surface-variant">Agency</span>
                    <span className="font-semibold text-white">
                      {result ? `${result.agency} (${result.city})` : "Irvine Performance"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-panel group relative overflow-hidden rounded-xl border border-primary/20 p-8">
                <div className="absolute -bottom-10 -right-10 opacity-5 transition-opacity group-hover:opacity-10">
                  <span className="material-symbols-outlined text-[160px]">schedule</span>
                </div>
                <h3 className="mb-2 font-label text-[10px] uppercase tracking-[0.3em] text-primary">
                  Estimated Completion
                </h3>
                <div className="font-headline text-4xl font-extrabold text-white">
                  {result
                    ? new Date(result.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "4:00 PM"}
                </div>
                <div className="mt-1 text-sm text-on-surface-variant">
                  {result
                    ? new Date(result.scheduledAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "Today, Oct 24"}
                </div>
              </div>
            </div>

            <div className="rounded-xl border-t border-white/5 bg-surface-container-low p-10 shadow-xl lg:col-span-8">
              <div className="mb-12 flex items-center justify-between">
                <h3 className="font-headline text-xl font-semibold">Service Timeline</h3>
                <button className="rounded-md border border-primary/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/10">
                  View Checklist
                </button>
              </div>

              <div className="relative flex flex-col space-y-12">
                <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-outline-variant/30" />
                <div className="absolute left-[19px] top-4 h-[50%] w-0.5 bg-primary shadow-[0_0_15px_rgba(166,200,255,0.4)]" />

                <div className="group relative flex items-start gap-8">
                  <div className="gradient-primary relative z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-lg text-on-primary">check</span>
                  </div>
                  <div className="flex-1 pb-4">
                    <h4 className="mb-1 font-headline text-lg font-bold text-white">Pending Arrival</h4>
                    <p className="text-sm text-on-surface-variant">
                      Vehicle checked in and initial diagnostics started.
                    </p>
                    <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-outline">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="group relative flex items-start gap-8">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-surface-container-high shadow-[0_0_20px_rgba(166,200,255,0.15)]">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="mb-1 flex items-center gap-3">
                      <h4 className="font-headline text-lg font-bold text-primary">In Progress</h4>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-on-surface">
                      Technical team performing inspection and updates.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-white/5 bg-surface-container-high p-3">
                        <span className="block text-[10px] font-bold uppercase text-outline">Vehicle</span>
                        <span className="text-xs font-semibold text-tertiary">
                          {result ? (result.matricule ?? "Foreign") : "Connected"}
                        </span>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-surface-container-high p-3">
                        <span className="block text-[10px] font-bold uppercase text-outline">Status</span>
                        <span className="text-xs font-semibold text-primary">
                          {result ? statusLabel(result.status) : "Updating..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="group relative flex items-start gap-8 opacity-40">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-outline-variant bg-surface-container-high">
                    <span className="material-symbols-outlined text-lg text-outline-variant">key</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-headline text-lg font-bold text-white">Ready for Pickup</h4>
                    <p className="text-sm text-on-surface-variant">
                      Final detailing and quality inspection before release.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-16 rounded-xl border-l-4 border-tertiary bg-surface-container-highest/50 p-6">
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-tertiary">info</span>
                  <div>
                    <p className="text-sm font-medium text-on-surface">Technical Note:</p>
                    <p className="text-sm text-on-surface-variant">
                      Service progress will refresh each time you track with your reference or VIN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-7xl px-8">
          <h2 className="mb-10 font-headline text-3xl font-bold tracking-tight">SERVICE LOCATION</h2>
          <div className="grid h-auto grid-cols-1 gap-8 md:h-[400px] md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl md:col-span-2">
              <img
                alt=""
                className="h-full w-full object-cover grayscale brightness-50 transition-transform duration-700 group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5X3NfIOcT1ZQQAJjOKQh5dtNmP6ZeZgIzYViHW4nanVMLT9vnpuAFKoV1mFf4tVfZd23uZCDdi7N1Ue-dVXA92UnyNRNzoEQXjRvoqp9HDXABFkE1zu9NZST-fqhE4GWRAM48mbIxT4FPzTM2A6y4x9V6RBp191yoZzwKisuMYy0GPhBmzJayjqjnkl3fmOilEXQYwOUir07b1eQ7uKDzSe07I7iyr-f41o10CMMugcyGd1OTge0akZeEA4HMWcvYz8uJX4EIMzY"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="font-headline text-xl font-bold text-white">
                  {result?.agency ?? "KIA Performance Center"}
                </div>
                <div className="text-sm text-on-surface-variant">
                  {result ? `${result.city} Service Unit` : "Service center location"}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border-t border-white/5 bg-surface-container-low p-8">
              <div>
                <h3 className="mb-4 font-headline text-lg font-bold text-white">Contact Service</h3>
                <div className="space-y-4">
                  <div className="group flex cursor-pointer items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high transition-colors group-hover:bg-primary">
                      <span className="material-symbols-outlined text-sm text-primary group-hover:text-on-primary">call</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-outline">Call Advisor</div>
                      <div className="text-sm font-semibold text-white">Support Desk</div>
                    </div>
                  </div>
                  <div className="group flex cursor-pointer items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high transition-colors group-hover:bg-primary">
                      <span className="material-symbols-outlined text-sm text-primary group-hover:text-on-primary">chat</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-outline">Live Chat</div>
                      <div className="text-sm font-semibold text-white">Message Service</div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full rounded-md border-2 border-outline-variant py-4 font-label text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-surface-container-high">
                Get Directions
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-[#414751]/20 bg-[#0d141c] px-8 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 font-body text-sm tracking-wide md:flex-row">
          <div className="font-headline font-black text-white">KIA VELOCITY PULSE</div>
          <div className="flex gap-8">
            <Link className="text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Privacy
            </Link>
            <Link className="text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Contact
            </Link>
            <Link className="text-[#c1c6d3] transition-colors hover:text-[#a6c8ff]" href="/faq">
              Agency Locator
            </Link>
          </div>
          <div className="text-[#c1c6d3] opacity-60">© 2024 KIA VELOCITY PULSE. KINETIC ATELIER.</div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-[#414751]/15 bg-[#0d141c]/80 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-[20px] md:hidden">
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-opacity hover:opacity-100" href="/">
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 text-[10px] font-body font-semibold uppercase tracking-widest">Home</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-opacity hover:opacity-100" href="/faq">
          <span className="material-symbols-outlined">directions_car</span>
          <span className="mt-1 text-[10px] font-body font-semibold uppercase tracking-widest">My Cars</span>
        </Link>
        <Link className="flex flex-col items-center justify-center rounded-xl bg-[#242a33] px-4 py-1 text-[#a6c8ff] transition-transform" href="/book">
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="mt-1 text-[10px] font-body font-semibold uppercase tracking-widest">Book</span>
        </Link>
        <Link className="flex scale-110 flex-col items-center justify-center text-[#a6c8ff]" href="/track">
          <span className="material-symbols-outlined">notifications</span>
          <span className="mt-1 text-[10px] font-body font-semibold uppercase tracking-widest">Alerts</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-[#c1c6d3] opacity-60 transition-opacity hover:opacity-100" href="/api/auth/me">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-[10px] font-body font-semibold uppercase tracking-widest">Profile</span>
        </Link>
      </nav>
    </>
  );
}
