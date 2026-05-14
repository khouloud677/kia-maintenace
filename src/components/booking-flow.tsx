"use client";

import Link from "next/link";

export type BookingChannel = "SMS" | "EMAIL";

export type BookingStepId =
  | "details"
  | "verify"
  | "services"
  | "agency"
  | "schedule"
  | "confirmation";

export type BookingStepStatus = "complete" | "current" | "upcoming";

export type BookingContext = {
  serviceId?: string;
  agencyId?: string;
  token?: string;
  vin?: string;
  matricule?: string;
  isForeign?: boolean;
  channel?: string;
  contactValue?: string;
  reference?: string;
  scheduledAt?: string;
  serviceName?: string;
  agencyName?: string;
  agencyCity?: string;
  vehicleName?: string;
  plate?: string;
  vinTail?: string;
};

export type BookingStep = {
  id: BookingStepId;
  label: string;
  href: (context: BookingContext) => string;
};

const bookingSteps: BookingStep[] = [
  {
    id: "details",
    label: "Vehicle Details",
    href: () => "/book",
  },
  {
    id: "verify",
    label: "Verification",
    href: (context) => `/book/verify?${buildBookingQuery(context)}`,
  },
  {
    id: "services",
    label: "Services",
    href: (context) => `/book/services?${buildBookingQuery(context)}`,
  },
  {
    id: "agency",
    label: "Agency",
    href: (context) => `/book/agency?${buildBookingQuery(context)}`,
  },
  {
    id: "schedule",
    label: "Schedule",
    href: (context) => `/book/schedule?${buildBookingQuery(context)}`,
  },
  {
    id: "confirmation",
    label: "Confirmation",
    href: (context) => `/book/confirmation?${buildBookingQuery(context)}`,
  },
];

export function buildBookingQuery(context: BookingContext) {
  const params = new URLSearchParams();

  if (context.serviceId) params.set("serviceId", context.serviceId);
  if (context.agencyId) params.set("agencyId", context.agencyId);
  if (context.token) params.set("token", context.token);
  if (context.vin) params.set("vin", context.vin);
  if (context.matricule) params.set("matricule", context.matricule);
  if (typeof context.isForeign === "boolean") params.set("isForeign", String(context.isForeign));
  if (context.channel) params.set("channel", context.channel);
  if (context.contactValue) params.set("contactValue", context.contactValue);
  if (context.reference) params.set("reference", context.reference);
  if (context.scheduledAt) params.set("scheduledAt", context.scheduledAt);
  if (context.serviceName) params.set("serviceName", context.serviceName);
  if (context.agencyName) params.set("agencyName", context.agencyName);
  if (context.agencyCity) params.set("agencyCity", context.agencyCity);
  if (context.vehicleName) params.set("vehicleName", context.vehicleName);
  if (context.plate) params.set("plate", context.plate);
  if (context.vinTail) params.set("vinTail", context.vinTail);

  return params.toString();
}

export function getBookingSteps() {
  return bookingSteps;
}

export function getBookingStepIndex(stepId: BookingStepId) {
  return bookingSteps.findIndex((step) => step.id === stepId);
}

export function getBookingStepStatus(stepId: BookingStepId, currentStep: BookingStepId): BookingStepStatus {
  const stepIndex = getBookingStepIndex(stepId);
  const currentIndex = getBookingStepIndex(currentStep);

  if (stepIndex < currentIndex) return "complete";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export function getBookingStepHref(stepId: BookingStepId, context: BookingContext) {
  return bookingSteps.find((step) => step.id === stepId)?.href(context) ?? "/book";
}

export function getContactLabel(channel: string) {
  return channel === "EMAIL" ? "Email address" : "Phone number";
}

export function getContactPlaceholder(channel: string) {
  return channel === "EMAIL" ? "your.email@example.com" : "+212 6XX XXX XXX";
}

export function getContactChangeLabel(channel: string) {
  return channel === "EMAIL" ? "Change email address" : "Change phone number";
}

type BookingHeaderProps = {
  title: string;
  context: BookingContext;
  currentStep: BookingStepId;
  backHref?: string;
  backLabel?: string;
  showLogout?: boolean;
};

export function BookingHeader({
  title,
  context,
  currentStep,
  backHref = "/",
  backLabel = "Home",
  showLogout = true,
}: BookingHeaderProps) {
  const currentIndex = getBookingStepIndex(currentStep);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d141c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="font-headline text-lg font-black tracking-[0.2em] text-white sm:text-2xl">
          KIA VELOCITY
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <span className="font-headline text-xs font-bold uppercase tracking-[0.25em] text-[#a6c8ff]">
            {title}
          </span>
          <span className="hidden xl:block font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
            {context.vin ? `VIN ${context.vin.slice(-4)}` : "Booking"}
          </span>
          <div className="flex items-center gap-4">
            <Link className="font-headline text-sm font-bold uppercase tracking-widest text-[#c1c6d3] transition-colors hover:text-white" href={backHref}>
              {backLabel}
            </Link>
            <Link className="font-headline text-sm font-bold uppercase tracking-widest text-[#c1c6d3] transition-colors hover:text-white" href="/track">
              Track
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 lg:flex">
            {getBookingSteps().map((step, index) => {
              const status = getBookingStepStatus(step.id, currentStep);

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      status === "complete"
                        ? "bg-emerald-400"
                        : status === "current"
                          ? "bg-primary"
                          : "bg-white/20"
                    }`}
                  />
                  {index < currentIndex ? <span className="h-px w-6 bg-white/10" /> : null}
                </div>
              );
            })}
          </div>

          {showLogout ? (
            <a
              href="/api/auth/keycloak/logout"
              className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-200 transition-colors hover:bg-rose-400/20"
            >
              Logout
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}

type BookingSidebarProps = {
  context: BookingContext;
  currentStep: BookingStepId;
};

export function BookingSidebar({ context, currentStep }: BookingSidebarProps) {
  return (
    <aside className="fixed left-0 top-20 z-40 hidden h-[calc(100vh-5rem)] w-72 flex-col border-r border-white/5 bg-[#0d141c]/95 py-8 lg:flex">
      <div className="mb-8 px-8">
        <h2 className="font-headline text-lg font-bold text-[#a6c8ff]">Booking Flow</h2>
        <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant">Keep your booking context in view</p>
      </div>

      <div className="px-4">
        <div className="mb-6 rounded-2xl border border-primary/15 bg-surface-container-low px-4 py-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">Current Step</p>
          <p className="font-headline text-lg font-bold text-white">
            {bookingSteps[getBookingStepIndex(currentStep)]?.label}
          </p>
        </div>

        <div className="space-y-2">
          {bookingSteps.map((step) => {
            const status = getBookingStepStatus(step.id, currentStep);

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 rounded-r-full px-6 py-4 transition-colors ${
                  status === "current"
                    ? "bg-gradient-to-r from-[#005baa] to-[#a6c8ff] text-white shadow-[0_0_15px_rgba(0,91,170,0.25)]"
                    : status === "complete"
                      ? "bg-surface-container-low text-on-surface-variant"
                      : "text-[#6f7683]"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${status === "current" ? "material-filled" : ""}`}
                >
                  {status === "complete" ? "check_circle" : step.id === "agency" ? "hub" : step.id === "schedule" ? "calendar_today" : step.id === "confirmation" ? "check_circle" : step.id === "verify" ? "verified_user" : "person"}
                </span>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                    {status === "current" ? "In progress" : status === "complete" ? "Completed" : "Locked"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">Context</p>
          <p className="mt-2 break-words">
            {context.vin ? `VIN ${context.vin}` : "VIN not set"}
          </p>
        </div>
      </div>
    </aside>
  );
}

