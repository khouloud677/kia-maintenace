"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookingHeader,
  BookingSidebar,
  buildBookingQuery,
  getContactChangeLabel,
} from "@/components/booking-flow";

type StartResponse = {
  token: string;
  maskedContact: string;
  expiresAt: string;
};

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function VerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vin = searchParams.get("vin") ?? "";
  const matricule = searchParams.get("matricule") ?? "";
  const isForeign = searchParams.get("isForeign") === "true";
  const channel = "EMAIL";
  const contactValue = searchParams.get("contactValue") ?? "";

  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [maskedContact, setMaskedContact] = useState(searchParams.get("maskedContact") ?? "");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendLeft, setResendLeft] = useState(30);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const canStart = useMemo(() => {
    return Boolean(contactValue && vin.length === 17);
  }, [contactValue, vin]);

  useEffect(() => {
    if (resendLeft <= 0) return;

    const timer = setInterval(() => {
      setResendLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendLeft]);

  async function startVerification() {
    if (!canStart) {
      setError("VIN and contact are required to send verification code.");
      return;
    }

    setPending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/guest/verification/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          contactValue,
          vehicle: {
            vin,
            matricule,
            isForeign,
          },
        }),
      });

      const data = await readJsonSafe<StartResponse | { error?: string }>(response);

      if (!response.ok) {
        const message = data && "error" in data ? data.error : undefined;
        throw new Error(message || "Failed to send verification code");
      }

      if (!data || !("token" in data)) {
        throw new Error("Invalid verification response from server");
      }

      const payload = data as StartResponse;
      setToken(payload.token);
      setMaskedContact(payload.maskedContact);
      setExpiresAt(payload.expiresAt);
      setResendLeft(30);
      setSuccess("Verification code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (!token && canStart) {
      startVerification().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canStart]);

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit && value !== "") return;

    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  async function verifyAndContinue() {
    setError("");
    setSuccess("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (!token) {
      setError("Session token missing. Please resend the code.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/guest/verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code }),
      });

      const data = await readJsonSafe<{ verified?: boolean; error?: string }>(response);

      if (!response.ok || !data?.verified) {
        throw new Error(data?.error || "Invalid verification code");
      }

      setSuccess("Identity verified successfully.");

      router.push(
        `/book/services?${buildBookingQuery({
          token,
          vin,
          matricule: matricule || undefined,
          isForeign,
          contactValue,
          channel,
        })}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <BookingHeader title="Verification" context={{ token, vin, matricule, isForeign, contactValue }} currentStep="verify" backHref="/book" backLabel="Back" />

      <BookingSidebar
        context={{ token, vin, matricule, isForeign, contactValue }}
        currentStep="verify"
      />

      <main className="relative flex min-h-[calc(100vh-160px)] items-center justify-center overflow-hidden px-6 py-12">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary-container/10 blur-[120px]" />

        <div className="z-10 w-full max-w-md lg:ml-72">
          <div className="mb-12">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-on-surface-variant transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
              <span className="font-label text-xs font-semibold uppercase tracking-widest">Vehicle Details</span>
            </button>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h1 className="mb-4 font-headline text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Verify Your <br />
              <span className="text-primary">Identity</span>
            </h1>
            <p className="leading-relaxed text-on-surface-variant">
              We&apos;ve sent a 6-digit code to <span className="font-semibold text-on-surface">{maskedContact || "your email address"}</span>. Enter it below to continue your booking.
            </p>
            {expiresAt ? (
              <p className="mt-2 text-xs uppercase tracking-widest text-on-surface-variant">
                Expires at {new Date(expiresAt).toLocaleTimeString("fr-TN")}
              </p>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="flex justify-between gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  value={digit}
                  onChange={(event) => updateOtp(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !otp[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  aria-label={`OTP digit ${index + 1}`}
                  maxLength={1}
                  inputMode="numeric"
                  className="otp-glow h-16 w-full rounded-t-lg border-0 border-b-2 border-outline-variant bg-surface-container-lowest text-center font-headline text-2xl font-bold text-primary outline-none transition-all duration-200 focus:border-primary focus:bg-surface-container-high md:h-20 md:text-3xl"
                  placeholder="·"
                />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={verifyAndContinue}
                disabled={pending}
                className="primary-gradient w-full rounded-lg py-5 font-headline font-bold uppercase tracking-widest text-on-primary transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Verifying..." : "Verify & Continue"}
              </button>

              {error ? <p className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
              {success ? <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p> : null}

              <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <button
                  onClick={startVerification}
                  disabled={pending || resendLeft > 0}
                  className="group flex items-center gap-2 text-on-surface-variant transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  <span className="font-label text-xs uppercase tracking-widest">
                    Resend Code <span className="ml-1 text-primary/60">{resendLeft}s</span>
                  </span>
                </button>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-on-surface-variant transition-colors hover:text-white"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  <span className="font-label text-xs uppercase tracking-widest">{getContactChangeLabel("EMAIL")}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="glass-effect mt-16 flex items-center gap-6 rounded-xl border border-white/5 p-6">
            <div className="relative">
              <span className="material-symbols-outlined text-4xl text-primary">shield_person</span>
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-tertiary" />
            </div>
            <div>
              <h4 className="font-headline text-sm font-bold uppercase tracking-wider text-white">Secure Session</h4>
              <p className="text-xs text-on-surface-variant">
                Encrypted connection active for your maintenance booking.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-white/5 bg-[#0d141c]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-12 py-8 md:flex-row">
          <div className="font-body text-xs uppercase tracking-widest text-gray-500">© 2024 KIA MOTORS. THE KINETIC ATELIER.</div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link className="font-body text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-[#a6c8ff]" href="/faq">
              Privacy Policy
            </Link>
            <Link className="font-body text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-[#a6c8ff]" href="/faq">
              Terms of Service
            </Link>
            <Link className="font-body text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-[#a6c8ff]" href="/faq">
              Cookie Settings
            </Link>
            <Link className="font-body text-xs uppercase tracking-widest text-gray-500 transition-colors hover:text-[#a6c8ff]" href="/faq">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      <div className="pointer-events-none fixed right-0 top-0 hidden h-full w-1/3 overflow-hidden opacity-20 lg:block">
        <img
          alt="Luxury car interior details"
          className="h-full w-full object-cover grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCddE0ZkN3AlwvTHFwmLZokKtL5mkXIFvpzBDDb_lrhP0J1whgtyu79AMS1_7LMNtPrlsJ1Ojq1AOgDQHAn4nBeMw8PB3p_G7Cl7qtLnrhA6Cc1PSVQA8eXL24sLtbeltibb2QZGlIkFLMJq8-8Dhr3CZmw6HG2KKc5Zzpf0PkkqyKCMSYqnNxfioF4fzuehaxot8C9FcsYa5-XcRHMF7gKlIIJ1HwRFfslH8qbnQMfWKAHjxY4eWwBIRDZx3AApEwEepjOVgzZp9E"
        />
      </div>
    </>
  );
}
