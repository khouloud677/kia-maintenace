"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookingHeader,
  BookingSidebar,
  buildBookingQuery,
} from "@/components/booking-flow";

type Service = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceEstimate: string | number | null;
};

type Agency = {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
};

type BookingResponse = {
  reference: string;
  scheduledAt: string;
};

function extractApiError(data: unknown, fallback = "Booking failed") {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as {
    error?: unknown;
  };

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (payload.error && typeof payload.error === "object") {
    const errorObject = payload.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };

    const formError = errorObject.formErrors?.find(Boolean);
    if (formError) {
      return formError;
    }

    const firstFieldError = Object.values(errorObject.fieldErrors ?? {})
      .flat()
      .find(Boolean);
    if (firstFieldError) {
      return firstFieldError;
    }
  }

  return fallback;
}

const morningSlots = ["08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
const afternoonSlots = ["01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];
const eveningSlots = ["05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM"];

function to24h(time12h: string) {
  const [time, ampm] = time12h.split(" ");
  const [hoursText, minutes] = time.split(":");
  let hours = Number(hoursText);

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function makeDateTimeIso(dateYmd: string, slot: string) {
  const hhmm = to24h(slot);
  return new Date(`${dateYmd}T${hhmm}:00`).toISOString();
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") ?? "";
  const agencyId = searchParams.get("agencyId") ?? "";
  const channel = (searchParams.get("channel") ?? "EMAIL").toUpperCase();
  const contactValue = searchParams.get("contactValue") ?? "";

  const [services, setServices] = useState<Service[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loadError, setLoadError] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState<"MORNING" | "AFTERNOON" | "EVENING">("MORNING");
  const [selectedSlot, setSelectedSlot] = useState("09:00 AM");
  const [expressDropoff, setExpressDropoff] = useState(true);

  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [vin, setVin] = useState(searchParams.get("vin") ?? "");
  const [matricule, setMatricule] = useState(searchParams.get("matricule") ?? "");
  const [isForeign, setIsForeign] = useState(searchParams.get("isForeign") === "true");
  const [notes, setNotes] = useState("");

  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  useEffect(() => {
    async function load() {
      setLoadError("");
      try {
        const [serviceRes, agencyRes] = await Promise.all([
          fetch("/api/services"),
          fetch(serviceId ? `/api/agencies?serviceId=${serviceId}` : "/api/agencies"),
        ]);

        if (!serviceRes.ok || !agencyRes.ok) {
          throw new Error("Could not load schedule context");
        }

        setServices((await serviceRes.json()) as Service[]);
        setAgencies((await agencyRes.json()) as Agency[]);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Could not load schedule context");
      }
    }

    load();
  }, [serviceId]);

  const selectedService = services.find((item) => item.id === serviceId) ?? null;
  const selectedAgency = agencies.find((item) => item.id === agencyId) ?? null;

  const slots =
    period === "MORNING"
      ? morningSlots
      : period === "AFTERNOON"
        ? afternoonSlots
        : eveningSlots;

  const unavailable = useMemo(() => new Set(["10:00 AM", "10:30 AM"]), []);

  const dateOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const value = date.toISOString().slice(0, 10);
      return { value, label: formatDateLabel(date), day: date.getDate() };
    });
  }, []);

  async function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setBooking(null);

    if (!serviceId || !agencyId) {
      setSubmitError("Missing service or agency selection. Go back to previous steps.");
      return;
    }

    if (vin.length !== 17) {
      setSubmitError("VIN must be exactly 17 characters.");
      return;
    }

    if (!token) {
      setSubmitError("Guest verification token is required.");
      return;
    }

    setSubmitPending(true);

    try {
      const response = await fetch("/api/appointments/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          serviceId,
          agencyId,
          scheduledAt: makeDateTimeIso(selectedDate, selectedSlot),
          notes: expressDropoff ? `Express drop-off enabled. ${notes}`.trim() : notes,
          vehicle: {
            vin: vin.toUpperCase(),
            matricule: matricule.toUpperCase(),
            isForeign,
          },
        }),
      });

      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as unknown) : null;

      if (!response.ok) {
        throw new Error(extractApiError(data));
      }

      if (!data || typeof data !== "object") {
        throw new Error("Invalid booking response from server");
      }

      const bookingData = data as { reference?: unknown; scheduledAt?: unknown };

      if (typeof bookingData.reference !== "string" || typeof bookingData.scheduledAt !== "string") {
        throw new Error("Booking response is missing required fields");
      }

      setBooking({
        reference: bookingData.reference,
        scheduledAt: bookingData.scheduledAt,
      });

      router.push(
        `/book/confirmation?${buildBookingQuery({
          reference: bookingData.reference,
          scheduledAt: bookingData.scheduledAt,
          serviceName: selectedService?.name ?? undefined,
          agencyName: selectedAgency?.name ?? undefined,
          agencyCity: selectedAgency?.city ?? undefined,
          vehicleName: "KIA EV6 GT-LINE",
          plate: matricule || "FOREIGN",
          vinTail: vin ? vin.slice(-4) : undefined,
        })}`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitPending(false);
    }
  }

  return (
    <>
      <BookingHeader
        title="Schedule"
        context={{ serviceId, agencyId, token, vin, matricule, isForeign, channel, contactValue }}
        currentStep="schedule"
        backHref={`/book/agency?${buildBookingQuery({ serviceId, agencyId, token, vin, matricule: matricule || undefined, isForeign, channel, contactValue })}`}
        backLabel="Back"
      />

      <BookingSidebar
        context={{ serviceId, agencyId, token, vin, matricule, isForeign, channel, contactValue }}
        currentStep="schedule"
      />

      <main className="min-h-screen px-4 pb-12 pt-8 lg:ml-72 lg:px-8">
        <form onSubmit={onConfirm} className="mx-auto grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-8 xl:col-span-8">
            <div>
              <h1 className="mb-2 font-headline text-5xl font-extrabold tracking-tighter text-white">SCHEDULE YOUR VISIT</h1>
              <div className="blue-gradient h-1 w-24 rounded-full" />
            </div>

            {loadError ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-200">{loadError}</p> : null}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl bg-surface-container-low p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-headline text-lg font-semibold text-primary">SELECT DATE</h3>
                </div>

                <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                  <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {dateOptions.map((date) => (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => setSelectedDate(date.value)}
                      className={`h-10 rounded-lg text-center transition-colors ${
                        selectedDate === date.value
                          ? "blue-gradient text-white font-bold shadow-lg shadow-primary/20"
                          : "hover:bg-surface-container-high"
                      }`}
                      title={date.label}
                    >
                      {date.day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 rounded-xl bg-surface-container-low p-6">
                <div>
                  <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Select Time Slot</span>
                  <div className="mb-6 flex gap-2">
                    {(["MORNING", "AFTERNOON", "EVENING"] as const).map((slotGroup) => (
                      <button
                        key={slotGroup}
                        type="button"
                        onClick={() => {
                          setPeriod(slotGroup);
                          setSelectedSlot(slotGroup === "MORNING" ? "09:00 AM" : slotGroup === "AFTERNOON" ? "02:00 PM" : "06:00 PM");
                        }}
                        className={`flex-1 rounded-md px-3 py-2 text-xs font-bold ${
                          period === slotGroup
                            ? "border border-primary/20 bg-surface-container-high text-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {slotGroup}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const disabled = unavailable.has(slot);
                      const active = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg px-4 py-3 text-center text-sm transition-all ${
                            disabled
                              ? "cursor-not-allowed border border-outline-variant/10 bg-surface-container opacity-40"
                              : active
                                ? "blue-gradient text-white shadow-lg shadow-primary/20 font-bold"
                                : "border border-outline-variant/10 bg-surface-container-high font-medium hover:border-primary"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between rounded-lg border-l-4 border-primary bg-surface-container-lowest p-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Express Drop-off</h4>
                    <p className="text-[10px] text-on-surface-variant">Drop your keys and go. Skip the counter.</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      aria-label="Express drop-off"
                      title="Express drop-off"
                      checked={expressDropoff}
                      onChange={(event) => setExpressDropoff(event.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-surface-container peer-checked:bg-primary-container after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="glass-panel rounded-xl border border-outline-variant/10 p-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">speed</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Est. Duration</span>
                </div>
                <div className="font-headline text-2xl font-bold text-white">{selectedService?.durationMin ?? 90} MINUTES</div>
              </div>
              <div className="glass-panel rounded-xl border border-outline-variant/10 p-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">precision_manufacturing</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Technician Level</span>
                </div>
                <div className="font-headline text-2xl font-bold text-white">MASTER ELITE</div>
              </div>
              <div className="glass-panel rounded-xl border border-outline-variant/10 p-6">
                <div className="mb-2 flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-primary">confirmation_number</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Booking Ref</span>
                </div>
                <div className="font-headline text-2xl font-bold text-white">{booking?.reference ?? "KV-PENDING"}</div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high p-8 shadow-xl">
                <h3 className="mb-6 font-headline text-xl font-bold uppercase tracking-tight text-white">Booking Summary</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded bg-surface-container-lowest">
                      <img
                        alt="Kia EV6 Profile"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvY7lkO8Uvu1voOv6xSeoHb4pVUN-B5o3OyIVpMCcG86MfaIihEPz9dGHRd2If3sYNZfwN9GYrXmYTxF6wZc89jVkiQCD-yhR8BiCj01lXnH-BjImZGFRe45X92dykhz8b6Aa_kgAg5hH3OXVJaxQVg7OHkCdIiUMraHCt7UFLgzQzP2CN1spV8m14mIH6DIkj_K7_WGTQ93cJYy2RAK-I0F_A5RuusTTGnxQZbnvKdH9HiPEDMw8VCqOppQs4vSoPBRSFmonhee8"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Vehicle</p>
                      <p className="font-headline font-bold text-white">2024 KIA EV6 GT</p>
                      <p className="text-xs text-on-surface-variant">VIN: {vin ? `...${vin.slice(-4)}` : "required"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border-l-2 border-primary bg-surface-container-low p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Service Selected</p>
                    <p className="font-bold text-white">{selectedService?.name ?? "No service selected"}</p>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Location</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">hub</span>
                      <p className="font-bold text-white">{selectedAgency?.name ?? "No agency selected"}</p>
                    </div>
                    <p className="ml-6 text-xs text-on-surface-variant">{selectedAgency?.city ?? ""}</p>
                  </div>

                  <div className="h-px bg-outline-variant/30" />

                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Proposed Appointment</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary">event</span>
                        <span className="font-bold">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "2-digit" })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary">schedule</span>
                        <span className="font-bold">{selectedSlot}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg bg-surface-container-low p-4">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Guest Verification Context</p>
                    <input
                      className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
                      placeholder="Verification token"
                      aria-label="Verification token"
                      value={token}
                      onChange={(event) => setToken(event.target.value)}
                    />
                    <input
                      className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
                      placeholder="VIN (17 chars)"
                      aria-label="VIN"
                      maxLength={17}
                      value={vin}
                      onChange={(event) => setVin(event.target.value.toUpperCase())}
                    />
                    <input
                      className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
                      placeholder="Matricule"
                      aria-label="Matricule"
                      value={matricule}
                      onChange={(event) => setMatricule(event.target.value.toUpperCase())}
                    />
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <input
                        type="checkbox"
                        aria-label="Foreign car"
                        checked={isForeign}
                        onChange={(event) => setIsForeign(event.target.checked)}
                      />
                      Foreign car
                    </label>
                    <textarea
                      className="h-16 w-full border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-0"
                      placeholder="Notes (optional)"
                      aria-label="Notes"
                      maxLength={500}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

                  {submitError ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{submitError}</p> : null}
                  {booking ? (
                    <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      Booking confirmed: {booking.reference} ({new Date(booking.scheduledAt).toLocaleString("fr-TN")})
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={submitPending || !serviceId || !agencyId}
                  className="blue-gradient mt-8 w-full rounded-lg py-5 font-headline text-lg font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(0,91,170,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitPending ? "CONFIRMING..." : "CONFIRM BOOKING"}
                </button>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="mb-2 flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined">verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-widest">Kia Velocity Promise</span>
                </div>
                <p className="text-xs leading-relaxed text-on-surface-variant">
                  Your service includes a complimentary exterior wash and multi-point health check using genuine Kia performance parts.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>

      <footer className="flex w-full items-center justify-between bg-[#0d141c] px-8 py-6 lg:pl-72">
        <div className="font-body text-[10px] uppercase tracking-widest text-[#c1c6d3]">© 2024 KIA MOTORS. PRECISION ENGINEERED.</div>
        <div className="flex gap-8">
          <Link className="font-body text-[10px] uppercase tracking-widest text-[#414751] transition-colors hover:text-[#a6c8ff]" href="/faq">
            Privacy Policy
          </Link>
          <Link className="font-body text-[10px] uppercase tracking-widest text-[#414751] transition-colors hover:text-[#a6c8ff]" href="/faq">
            Terms of Service
          </Link>
          <Link className="font-body text-[10px] uppercase tracking-widest text-[#414751] transition-colors hover:text-[#a6c8ff]" href="/faq">
            Contact Support
          </Link>
        </div>
      </footer>
    </>
  );
}
