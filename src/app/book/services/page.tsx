"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function parsePrice(value: Service["priceEstimate"]) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferCategory(service: Service) {
  const text = `${service.code} ${service.name} ${service.description ?? ""}`.toLowerCase();
  if (text.includes("paint") || text.includes("coating") || text.includes("body")) {
    return "Exterior";
  }
  return "Mechanical";
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ServiceSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const vin = searchParams.get("vin") ?? "";
  const matricule = searchParams.get("matricule") ?? "";
  const isForeign = searchParams.get("isForeign") === "true";
  const channel = searchParams.get("channel") ?? "";
  const contactValue = searchParams.get("contactValue") ?? "";

  const [services, setServices] = useState<Service[]>([]);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [category, setCategory] = useState<"All" | "Mechanical" | "Exterior">("All");

  useEffect(() => {
    async function loadServices() {
      setPending(true);
      setError("");

      try {
        const response = await fetch("/api/services");
        const raw = await response.text();
        const data = raw ? (JSON.parse(raw) as Service[] | { error?: string }) : null;

        if (!response.ok) {
          const apiError =
            data && typeof data === "object" && "error" in data ? String(data.error) : "Failed to load services";
          throw new Error(apiError);
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid services response format");
        }

        setServices(data);
        if (data[0]) {
          setSelectedServiceId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setPending(false);
      }
    }

    loadServices();
  }, []);

  const featuredService = services[0] ?? null;
  const sideService = services[1] ?? null;

  const filteredServices = useMemo(() => {
    if (category === "All") return services;
    return services.filter((service) => inferCategory(service) === category);
  }, [category, services]);

  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedTotal = selectedService ? parsePrice(selectedService.priceEstimate) : 0;

  function handleContinueToAgency() {
    if (!selectedService) return;

    router.push(
      `/book/agency?${buildBookingQuery({
        serviceId: selectedService.id,
        token,
        vin,
        matricule: matricule || undefined,
        isForeign,
        contactValue,
        channel,
      })}`
    );
  }

  return (
    <>
      <BookingHeader
        title="Services"
        context={{ token, vin, matricule, isForeign, channel, contactValue, serviceId: selectedServiceId || undefined }}
        currentStep="services"
        backHref={`/book/verify?${buildBookingQuery({ token, vin, matricule: matricule || undefined, isForeign, channel, contactValue })}`}
        backLabel="Back"
      />

      <BookingSidebar
        context={{ token, vin, matricule, isForeign, channel, contactValue, serviceId: selectedServiceId || undefined }}
        currentStep="services"
      />

      <main className="min-h-screen p-4 pb-36 pt-8 lg:ml-72 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-12">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="mb-2 block font-label text-xs uppercase tracking-[0.3em] text-primary">
                  Step 03 // Services
                </span>
                <h1 className="font-headline text-5xl font-bold leading-none tracking-tighter md:text-7xl">
                  SELECT YOUR <br />
                  <span className="text-gradient">SERVICES</span>
                </h1>
              </div>
              <div className="glass-panel rounded-xl border-l-4 border-primary p-6">
                <p className="mb-1 font-label text-sm uppercase tracking-wider text-on-surface-variant">
                  Current Vehicle
                </p>
                <p className="font-headline text-xl font-bold">KIA EV6 GT-LINE</p>
                <p className="text-xs font-medium text-primary">VIN: {vin.slice(-4)}</p>
              </div>
            </div>
          </header>

          <section className="mb-16">
            <h3 className="mb-6 flex items-center gap-3 font-headline text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              <span className="h-px w-8 bg-outline-variant" />
              Recommended for your vehicle
            </h3>

            {pending ? (
              <div className="rounded-xl bg-surface-container-low p-8 text-on-surface-variant">Loading services...</div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-red-200">{error}</div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="group relative col-span-1 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-xl bg-surface-container-high p-8 lg:col-span-2">
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-20 transition-transform duration-700 group-hover:scale-110">
                    <img
                      className="h-full w-full object-cover"
                      alt="Featured service"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKFUVhFbcA7TRHPOVWzmFEpyZlWJnFG02zxZ0AhV6PfNNPf6_C4USsrFiSM5uTSkxyHqzaLIQsiNjiTuCumw1iFCgtqNNU3xpWdzAcU19gXGo2CgjqK1evSAN1MnP20z00y44AZ2Be6bgdHjsPUMQu_q1PAQhXJOFlybI2ZcCQY5ZKGmF_F3bGYsuSspr2VH-vNgNSroOToo7fh8pXytFqBVKAfuEEIKSXdKPFPnxmAugrPff190gH0auhFoRHrb6ISsLwINouXmo"
                    />
                  </div>

                  <div className="relative z-10">
                    <span className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-on-primary">
                      Essential Maintenance
                    </span>
                    <h4 className="mb-2 font-headline text-3xl font-bold">
                      {featuredService?.name ?? "Service"}
                    </h4>
                    <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
                      {featuredService?.description ?? "Precision service for your vehicle performance."}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-on-surface-variant">Estimate</p>
                      <p className="font-headline text-3xl font-bold">
                        {featuredService ? formatPrice(parsePrice(featuredService.priceEstimate)) : "$0.00"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (featuredService) setSelectedServiceId(featuredService.id);
                      }}
                      className="btn-primary-gradient rounded-md px-8 py-4 font-label text-xs font-bold uppercase tracking-widest text-on-primary shadow-lg transition-opacity hover:opacity-90"
                    >
                      Select Service
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-xl bg-primary-container p-8 text-on-primary">
                  <div>
                    <span className="material-symbols-outlined material-filled mb-4 text-4xl">
                      speed
                    </span>
                    <h4 className="mb-2 font-headline text-xl font-bold leading-tight">
                      {sideService?.name ?? "Performance Optimization"}
                    </h4>
                    <p className="text-sm leading-relaxed opacity-80">
                      {sideService?.description ?? "Software calibration to ensure peak acceleration."}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-headline text-2xl font-bold">
                      {sideService ? formatPrice(parsePrice(sideService.priceEstimate)) : "$0.00"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (sideService) setSelectedServiceId(sideService.id);
                      }}
                      className="material-symbols-outlined cursor-pointer text-3xl transition-transform hover:translate-x-1"
                    >
                      arrow_forward
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="mb-24">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="flex items-center gap-3 font-headline text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                <span className="h-px w-8 bg-outline-variant" />
                Service Categories
              </h3>
              <div className="flex gap-4">
                {(["All", "Mechanical", "Exterior"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      category === item
                        ? "bg-surface-container-high text-primary"
                        : "bg-transparent text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => {
                const active = service.id === selectedServiceId;
                return (
                  <div
                    key={service.id}
                    className={`group cursor-pointer rounded-xl border-b-2 p-6 transition-colors ${
                      active
                        ? "border-primary bg-surface-container-high"
                        : "border-transparent bg-surface-container-low hover:border-primary hover:bg-surface-container-high"
                    }`}
                    onClick={() => setSelectedServiceId(service.id)}
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div className="rounded-lg bg-surface-variant p-3 transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                        <span className="material-symbols-outlined">auto_fix_high</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{service.durationMin} MINS</span>
                    </div>
                    <h5 className="mb-2 font-headline text-lg font-bold">{service.name}</h5>
                    <p className="mb-6 text-sm text-on-surface-variant">
                      {service.description ?? "Vehicle service optimized for performance and safety."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-headline font-bold">
                        {formatPrice(parsePrice(service.priceEstimate))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedServiceId(service.id)}
                        className="border-b border-primary/30 pb-1 text-xs font-bold uppercase tracking-widest text-primary transition-all group-hover:border-primary"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <footer className="fixed bottom-0 z-50 flex w-full items-center justify-between border-t border-outline-variant/20 bg-[#0d141c] px-8 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] lg:pl-72">
        <div className="hidden md:block">
          <p className="text-[10px] uppercase tracking-widest text-[#414751]">Total Estimate</p>
          <p className="font-headline text-2xl font-bold text-[#a6c8ff]">{formatPrice(selectedTotal)}</p>
        </div>

        <div className="flex items-center space-x-8">
          <div className="hidden space-x-6 md:flex">
            <Link
              className="text-[10px] uppercase tracking-widest text-[#414751] transition-colors hover:text-[#a6c8ff]"
              href="/faq"
            >
              Privacy Policy
            </Link>
            <Link
              className="text-[10px] uppercase tracking-widest text-[#414751] transition-colors hover:text-[#a6c8ff]"
              href="/faq"
            >
              Contact Support
            </Link>
          </div>

          <button
            onClick={handleContinueToAgency}
            disabled={!selectedService}
            className={`btn-primary-gradient rounded-md px-12 py-4 text-xs font-bold uppercase tracking-widest text-on-primary transition-transform active:scale-95 ${
              selectedService ? "" : "pointer-events-none opacity-40"
            }`}
          >
            CONTINUE TO AGENCY
          </button>
        </div>
      </footer>
    </>
  );
}
