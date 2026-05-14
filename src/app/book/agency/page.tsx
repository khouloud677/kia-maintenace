"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  BookingHeader,
  BookingSidebar,
  buildBookingQuery,
} from "@/components/booking-flow";

type Agency = {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  services: { id: string; code: string; name: string }[];
};

function milesForIndex(index: number) {
  return (0.8 + index * 1.6).toFixed(1);
}

export default function AgencySelectionPage() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") ?? "";
  const token = searchParams.get("token") ?? "";
  const vin = searchParams.get("vin") ?? "";
  const matricule = searchParams.get("matricule") ?? "";
  const isForeign = searchParams.get("isForeign") ?? "false";
  const contactValue = searchParams.get("contactValue") ?? "";
  const channel = searchParams.get("channel") ?? "EMAIL";

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");

  useEffect(() => {
    async function loadAgencies() {
      setPending(true);
      setError("");

      try {
        const url = serviceId ? `/api/agencies?serviceId=${serviceId}` : "/api/agencies";
        const response = await fetch(url);
        const data = (await response.json()) as Agency[];

        if (!response.ok) {
          throw new Error("Failed to load agencies");
        }

        setAgencies(data);
        if (data[0]) {
          setSelectedAgencyId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load agencies");
      } finally {
        setPending(false);
      }
    }

    loadAgencies();
  }, [serviceId]);

  const filteredAgencies = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return agencies.filter((agency) => {
      const inSearch =
        normalized.length === 0 ||
        agency.name.toLowerCase().includes(normalized) ||
        agency.city.toLowerCase().includes(normalized) ||
        agency.address.toLowerCase().includes(normalized);

      const isPremium =
        agency.name.toLowerCase().includes("elite") ||
        agency.name.toLowerCase().includes("performance") ||
        agency.services.length >= 2;

      return inSearch && (!premiumOnly || isPremium);
    });
  }, [agencies, premiumOnly, query]);

  useEffect(() => {
    if (!filteredAgencies.some((agency) => agency.id === selectedAgencyId)) {
      setSelectedAgencyId(filteredAgencies[0]?.id ?? "");
    }
  }, [filteredAgencies, selectedAgencyId]);

  const selectedAgency = filteredAgencies.find((agency) => agency.id === selectedAgencyId) ?? null;
  const canContinue = Boolean(serviceId && selectedAgency);
  const nextParams = buildBookingQuery({
    serviceId: serviceId || undefined,
    agencyId: selectedAgencyId || undefined,
    token,
    vin,
    matricule: matricule || undefined,
    isForeign: isForeign === "true",
    contactValue,
    channel,
  });

  return (
    <>
      <BookingHeader
        title="Agency Selection"
        context={{ serviceId, token, vin, matricule, isForeign: isForeign === "true", channel, contactValue }}
        currentStep="agency"
        backHref={`/book/services?${buildBookingQuery({ serviceId, token, vin, matricule: matricule || undefined, isForeign: isForeign === "true", channel, contactValue })}`}
        backLabel="Back"
      />

      <BookingSidebar
        context={{ serviceId, token, vin, matricule, isForeign: isForeign === "true", channel, contactValue, agencyId: selectedAgencyId }}
        currentStep="agency"
      />

      <main className="flex min-h-screen flex-col pt-8 lg:ml-72">
        <header className="p-4 pb-4 lg:p-8 lg:pb-4">
          <h1 className="mb-6 font-headline text-[3.5rem] font-bold uppercase leading-none tracking-tighter">
            CHOOSE AN AGENCY
          </h1>

          <div className="mb-8 flex items-center gap-4">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className="relative h-1 flex-1 rounded-full bg-primary">
              <div className="absolute -top-1 left-0 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_#a6c8ff]" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-surface-container-highest" />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="relative w-full md:w-[400px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-lowest py-4 pl-12 font-label text-sm text-on-surface transition-all focus:border-primary focus:ring-0"
                placeholder="ENTER ZIP CODE OR CITY..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="group flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={premiumOnly}
                  onChange={(event) => setPremiumOnly(event.target.checked)}
                  className="sr-only"
                />
                <div className="flex h-5 w-5 items-center justify-center rounded-sm border-2 border-outline transition-colors group-hover:border-primary">
                  <span
                    className={`material-symbols-outlined text-[16px] text-primary transition-opacity ${
                      premiumOnly ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    }`}
                  >
                    check
                  </span>
                </div>
                <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                  Premium Centers Only
                </span>
              </label>

              <button className="flex items-center gap-2 rounded-md border border-outline-variant/20 bg-surface-container-high px-6 py-3 transition-all hover:bg-surface-container-highest">
                <span className="material-symbols-outlined text-sm">tune</span>
                <span className="font-label text-xs uppercase tracking-widest">Filters</span>
              </button>
            </div>
          </div>
        </header>

        <section className="flex flex-1 overflow-hidden">
          <div className="scroll-thin w-full space-y-4 overflow-y-auto p-8 md:w-2/5 xl:w-1/3">
            {pending ? <div className="rounded-xl bg-surface-container-low p-6">Loading agencies...</div> : null}
            {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">{error}</div> : null}
            {!pending && !error && filteredAgencies.length === 0 ? (
              <div className="rounded-xl bg-surface-container-low p-6 text-on-surface-variant">
                No agencies found for this filter.
              </div>
            ) : null}

            {filteredAgencies.map((agency, index) => {
              const selected = agency.id === selectedAgencyId;
              const isPremium =
                agency.name.toLowerCase().includes("elite") ||
                agency.name.toLowerCase().includes("performance") ||
                agency.services.length >= 2;

              return (
                <div
                  key={agency.id}
                  className={`cursor-pointer rounded-xl p-6 transition-all ${
                    selected
                      ? "border-l-4 border-primary bg-surface-container-high shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:translate-x-1"
                      : "border border-outline-variant/10 bg-surface-container-low hover:bg-surface-container-high"
                  }`}
                  onClick={() => setSelectedAgencyId(agency.id)}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      {selected ? (
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                          Selected Choice
                        </span>
                      ) : null}
                      <h3 className="font-headline text-xl font-bold transition-colors hover:text-primary">
                        {agency.name.toUpperCase()}
                      </h3>
                    </div>
                    <span className="text-xs text-on-surface-variant">{milesForIndex(index)} MILES</span>
                  </div>

                  <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                    {agency.address}
                    <br />
                    {agency.city}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {isPremium ? (
                        <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                          Premium
                        </span>
                      ) : (
                        <span className="rounded bg-outline-variant/20 px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
                          Certified
                        </span>
                      )}
                      {agency.services.length > 1 ? (
                        <span className="rounded bg-tertiary/10 px-2 py-1 text-[10px] font-bold uppercase text-tertiary">
                          Multi-Service
                        </span>
                      ) : null}
                    </div>

                    {selected ? (
                      <span className="material-symbols-outlined material-filled text-primary">check_circle</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAgencyId(agency.id)}
                        className="rounded-md border border-primary/30 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/10"
                      >
                        Select Agency
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative hidden flex-1 overflow-hidden bg-surface-container-lowest md:block">
            <div className="agency-map-bg pointer-events-none absolute inset-0 grayscale opacity-40 mix-blend-lighten" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0d141c_90%)]" />

            <div className="absolute left-1/3 top-1/4 cursor-pointer">
              <div className="relative z-10 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[#005baa] text-white shadow-[0_0_20px_rgba(0,91,170,0.6)]">
                <span className="material-symbols-outlined material-filled">directions_car</span>
              </div>
              <div className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded border border-primary/20 bg-surface-container-highest px-3 py-1 text-[10px] font-bold">
                {selectedAgency ? selectedAgency.name.toUpperCase() : "KIA AGENCY"}
              </div>
            </div>

            <div className="absolute left-2/3 top-1/2 opacity-70 transition-opacity hover:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/40 bg-surface-container-highest text-primary">
                <span className="material-symbols-outlined text-sm">location_on</span>
              </div>
            </div>

            <div className="absolute bottom-1/3 right-1/4 opacity-70 transition-opacity hover:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/40 bg-surface-container-highest text-primary">
                <span className="material-symbols-outlined text-sm">location_on</span>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 flex flex-col gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded border border-outline-variant/20 bg-surface-container-high transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">add</span>
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded border border-outline-variant/20 bg-surface-container-high transition-colors hover:bg-surface-container-highest">
                <span className="material-symbols-outlined">remove</span>
              </button>
              <button className="mt-2 flex h-10 w-10 items-center justify-center rounded bg-primary-container text-white shadow-lg">
                <span className="material-symbols-outlined">my_location</span>
              </button>
            </div>
          </div>
        </section>

        <footer className="z-40 flex flex-col items-center justify-between gap-6 border-t border-outline-variant/10 bg-surface-container-low p-8 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high">
              <span className="material-symbols-outlined text-primary">hub</span>
            </div>
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Selected Agency</p>
              <h4 className="font-headline text-lg font-bold">
                {selectedAgency ? selectedAgency.name.toUpperCase() : "NONE"}
              </h4>
            </div>
          </div>

          <Link
            href={canContinue ? `/book/schedule?${nextParams}` : "#"}
            aria-disabled={!canContinue}
            className={`group flex w-full items-center justify-center gap-3 rounded-md bg-gradient-to-r from-[#005baa] to-[#a6c8ff] px-12 py-5 shadow-[0_10px_40px_rgba(0,91,170,0.3)] transition-all md:w-auto ${
              canContinue ? "hover:scale-[1.02] active:scale-95" : "pointer-events-none opacity-40"
            }`}
          >
            <span className="font-headline text-sm font-black uppercase tracking-[0.2em] text-white">
              CONTINUE TO SCHEDULE
            </span>
            <span className="material-symbols-outlined text-white transition-transform group-hover:translate-x-2">
              arrow_forward
            </span>
          </Link>
        </footer>
      </main>

      <footer className="flex w-full items-center justify-between border-t border-outline-variant/10 bg-[#0d141c] px-8 py-6 lg:ml-64 lg:w-[calc(100%-16rem)]">
        <p className="font-body text-[10px] uppercase tracking-widest text-[#414751]">
          © 2024 KIA MOTORS. PRECISION ENGINEERED.
        </p>
        <div className="flex gap-6">
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
