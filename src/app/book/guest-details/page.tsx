"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function GuestDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId") ?? "";
  const agencyId = searchParams.get("agencyId") ?? "";

  const [vin, setVin] = useState("");
  const [matricule, setMatricule] = useState("");
  const [isForeign, setIsForeign] = useState(false);
  const [contactValue, setContactValue] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (vin.length !== 17) {
      setError("VIN must be exactly 17 characters.");
      return;
    }

    if (!contactValue) {
      setError("Please enter your email address.");
      return;
    }

    const nextParams = new URLSearchParams();
    nextParams.set("serviceId", serviceId);
    nextParams.set("agencyId", agencyId);
    nextParams.set("vin", vin.toUpperCase());
    if (matricule) nextParams.set("matricule", matricule.toUpperCase());
    nextParams.set("isForeign", String(isForeign));
    nextParams.set("channel", "EMAIL");
    nextParams.set("contactValue", contactValue);

    router.push(`/book/verify?${nextParams.toString()}`);
  }

  return (
    <>
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-[#0d141c]/60 px-8 shadow-[0_4px_40px_rgba(166,200,255,0.05)] backdrop-blur-xl">
        <div className="font-headline text-2xl font-black tracking-tighter text-[#a6c8ff]">KIA VELOCITY</div>

        <div className="hidden gap-10 font-headline text-sm font-bold uppercase tracking-widest md:flex">
          <Link className="pb-2 text-[#c1c6d3] transition-colors duration-300 hover:text-white" href="/">
            Models
          </Link>
          <Link className="border-b-2 border-[#005baa] pb-2 text-[#a6c8ff] transition-colors duration-300 hover:text-white" href="/book">
            Service
          </Link>
          <Link className="pb-2 text-[#c1c6d3] transition-colors duration-300 hover:text-white" href="/track">
            Owners
          </Link>
          <Link className="pb-2 text-[#c1c6d3] transition-colors duration-300 hover:text-white" href="/faq">
            Innovation
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined scale-95 cursor-pointer text-[#a6c8ff] transition-transform active:scale-90">
            notifications
          </span>
          <span className="material-symbols-outlined scale-95 cursor-pointer text-[#a6c8ff] transition-transform active:scale-90">
            account_circle
          </span>
        </div>
      </nav>

      <aside className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-64 flex-col bg-[#0d141c] py-8 lg:flex">
        <div className="mb-12 px-8">
          <h2 className="font-headline text-xl font-bold text-[#a6c8ff]">Booking Flow</h2>
          <p className="font-body text-xs font-medium uppercase tracking-widest text-[#c1c6d3]">
            The Kinetic Atelier
          </p>
        </div>

        <nav className="flex flex-col gap-2 font-body text-sm font-medium">
          <Link
            href="/book"
            className="flex cursor-pointer items-center gap-4 px-6 py-3 text-[#c1c6d3] transition-all hover:bg-[#151c25]"
          >
            <span className="material-symbols-outlined material-filled text-primary">check_circle</span>
            <span>Service Selection</span>
          </Link>
          <Link
            href={`/book/agency?serviceId=${serviceId}`}
            className="flex cursor-pointer items-center gap-4 px-6 py-3 text-[#c1c6d3] transition-all hover:bg-[#151c25]"
          >
            <span className="material-symbols-outlined material-filled text-primary">check_circle</span>
            <span>Agency Location</span>
          </Link>
          <div className="flex cursor-pointer items-center gap-4 rounded-r-full bg-gradient-to-r from-[#005baa] to-[#a6c8ff] px-6 py-3 text-white shadow-[0_0_15px_rgba(0,91,170,0.3)]">
            <span className="material-symbols-outlined material-filled">person</span>
            <span>Vehicle Details</span>
          </div>
          <div className="flex cursor-pointer items-center gap-4 px-6 py-3 text-[#c1c6d3] transition-all hover:bg-[#151c25]">
            <span className="material-symbols-outlined">verified_user</span>
            <span>Verification</span>
          </div>
          <div className="flex cursor-pointer items-center gap-4 px-6 py-3 text-[#c1c6d3] transition-all hover:bg-[#151c25]">
            <span className="material-symbols-outlined">calendar_today</span>
            <span>Schedule</span>
          </div>
          <div className="flex cursor-pointer items-center gap-4 px-6 py-3 text-[#c1c6d3] transition-all hover:bg-[#151c25]">
            <span className="material-symbols-outlined">check_circle</span>
            <span>Confirmation</span>
          </div>
        </nav>
      </aside>

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12 pt-28 lg:ml-64">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary-container/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md">
          <button
            onClick={() => router.back()}
            className="group mb-12 flex items-center gap-2 text-on-surface-variant transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
            <span className="font-label text-xs font-semibold uppercase tracking-widest">Back to Agency</span>
          </button>

          <div className="mb-10">
            <h1 className="mb-4 font-headline text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Your <br />
              <span className="text-primary">Vehicle Details</span>
            </h1>
            <p className="leading-relaxed text-on-surface-variant">
              We need your VIN and preferred contact method to complete your booking and send you a verification code.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                <span className="material-symbols-outlined mr-2 inline align-middle text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Vehicle VIN
              </label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="Enter 17-character VIN"
                maxLength={17}
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <p className="mt-1 text-[10px] text-on-surface-variant">
                {vin.length}/17 characters
              </p>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                License Plate (Optional)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="Enter plate number"
                  maxLength={20}
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 transition-all hover:bg-surface-container-high">
                  <input
                    type="checkbox"
                    checked={isForeign}
                    onChange={(e) => setIsForeign(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-on-surface">Foreign</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Email Address
              </label>
              <input
                type="email"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-[#005baa] to-[#a6c8ff] px-6 py-4 font-headline text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              Continue to Verification
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-outline-variant/20 bg-surface-container-low p-6">
            <p className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Security Notice
            </p>
            <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
              Your VIN and contact information are encrypted and only used for appointment booking and verification.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
