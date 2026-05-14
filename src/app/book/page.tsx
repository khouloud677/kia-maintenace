"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  BookingHeader,
  buildBookingQuery,
  getContactLabel,
  getContactPlaceholder,
} from "@/components/booking-flow";

type OcrVehicleResponse = {
  vin?: string;
  matricule?: string;
  error?: string;
};

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function QuickBookingPage() {
  const router = useRouter();

  const [vin, setVin] = useState("");
  const [matricule, setMatricule] = useState("");
  const [isForeign, setIsForeign] = useState(false);
  const [documentImage, setDocumentImage] = useState<File | null>(null);
  const [ocrPending, setOcrPending] = useState(false);
  const [ocrMessage, setOcrMessage] = useState("");
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
      setError(`Please enter your ${getContactLabel("EMAIL").toLowerCase()}.`);
      return;
    }

    router.push(
      `/book/verify?${buildBookingQuery({
        vin: vin.toUpperCase(),
        matricule: matricule ? matricule.toUpperCase() : undefined,
        isForeign,
        channel: "EMAIL",
        contactValue,
      })}`
    );
  }

  async function handleOcrScan() {
    setError("");
    setOcrMessage("");

    if (!documentImage) {
      setError("Please upload a document image before scanning.");
      return;
    }

    setOcrPending(true);

    try {
      const payload = new FormData();
      payload.set("image", documentImage);

      const response = await fetch("/api/ocr/vehicle", {
        method: "POST",
        body: payload,
      });

      const data = await readJsonSafe<OcrVehicleResponse>(response);

      if (!response.ok) {
        setError(data?.error || "Unable to scan the document. Please try again.");
        return;
      }

      if (!data) {
        setError("Invalid response received from OCR service.");
        return;
      }

      if (data.vin) setVin(data.vin.toUpperCase());
      if (data.matricule) setMatricule(data.matricule.toUpperCase());

      if (!data.vin && !data.matricule) {
        setOcrMessage("Scan completed, but we could not confidently extract VIN or matricule. Please fill them manually.");
        return;
      }

      setOcrMessage("Scan completed. VIN and matricule fields were updated.");
    } catch {
      setError("Unable to scan the document right now. Please try again.");
    } finally {
      setOcrPending(false);
    }
  }


  return (
    <>
      <BookingHeader title="Booking" context={{ vin, matricule, isForeign, contactValue }} currentStep="details" backHref="/" backLabel="Home" />

      <main className="relative flex min-h-screen items-center justify-center px-6 py-12 pt-10">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary-container/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-12 text-center">
            <h1 className="mb-4 font-headline text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Book Your <br />
              <span className="text-primary">Service</span>
            </h1>
            <p className="leading-relaxed text-on-surface-variant">
              Enter your vehicle details to get started. We&apos;ll verify your information and help you book the perfect service.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                <span className="material-symbols-outlined mr-2 inline align-middle text-sm">error</span>
                {error}
              </div>
            )}

            {ocrMessage && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-primary">
                <span className="material-symbols-outlined mr-2 inline align-middle text-sm">check_circle</span>
                {ocrMessage}
              </div>
            )}

            <div>
              <label className="mb-2 block font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                Scan Vehicle Document (OCR)
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload vehicle document image"
                  onChange={(e) => setDocumentImage(e.target.files?.[0] || null)}
                  className="flex-1 cursor-pointer rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
                />

                <button
                  type="button"
                  onClick={handleOcrScan}
                  disabled={ocrPending}
                  className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-50"
                >
                  {ocrPending ? "Scanning..." : "Scan document"}
                </button>
              </div>
            </div>

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
              <div className="space-y-3">
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  placeholder="Enter plate number"
                  maxLength={20}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />

                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={isForeign}
                    onChange={(e) => setIsForeign(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest accent-primary"
                  />
                  <span className="font-medium">Foreign Car</span>
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
                placeholder={getContactPlaceholder("EMAIL")}
                required
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-[#005baa] to-[#a6c8ff] px-6 py-4 font-headline text-sm font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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

