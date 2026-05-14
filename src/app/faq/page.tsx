"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

const faqs = [
  {
    q: "Do I need an account to book an appointment?",
    a: "No. The website works in guest mode: enter your VIN and matricule, then verify your contact by SMS or email.",
  },
  {
    q: "Can I use OCR and still edit values?",
    a: "Yes. OCR suggests VIN and matricule from your uploaded image, and you can manually correct all fields before confirming.",
  },
  {
    q: "How does duplicate protection work?",
    a: "The platform blocks overlapping bookings for the same vehicle across both guest and logged mobile channels.",
  },
  {
    q: "How do I know when my car is ready?",
    a: "You receive notifications by SMS or email. Mobile users can also receive push notifications from the app layer.",
  },
];

export default function FaqPage() {
  const [reclamationState, setReclamationState] = useState<SubmitState>("idle");
  const [feedbackState, setFeedbackState] = useState<SubmitState>("idle");

  async function submitReclamation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReclamationState("loading");

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      appointmentReference: String(formData.get("appointmentReference") || ""),
      message: String(formData.get("message") || ""),
    };

    const response = await fetch("/api/reclamations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setReclamationState(response.ok ? "success" : "error");
    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackState("loading");

    const formData = new FormData(event.currentTarget);
    const payload = {
      rating: Number(formData.get("rating") || 0),
      comment: String(formData.get("comment") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      appointmentReference: String(formData.get("appointmentReference") || ""),
    };

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setFeedbackState(response.ok ? "success" : "error");
    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <section className="card p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Support & Feedback</p>
        <h1 className="mt-2 font-mono text-3xl font-bold text-accent">FAQ, reclamations, and ratings</h1>
      </section>

      <section className="card p-6">
        <h2 className="font-mono text-2xl font-semibold text-accent">Frequently Asked Questions</h2>
        <div className="mt-4 grid gap-4">
          {faqs.map((item) => (
            <article key={item.q} className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-slate-700">{item.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <form onSubmit={submitReclamation} className="card grid gap-3 p-6">
          <h2 className="font-mono text-xl font-semibold text-accent">Submit Reclamation</h2>
          <input
            name="fullName"
            placeholder="Full name"
            className="rounded-lg border border-slate-300 px-3 py-2"
            required
          />
          <input
            name="email"
            placeholder="Email (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="appointmentReference"
            placeholder="RDV reference (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            name="message"
            placeholder="Describe your issue"
            className="min-h-28 rounded-lg border border-slate-300 px-3 py-2"
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:bg-slate-400"
            disabled={reclamationState === "loading"}
          >
            {reclamationState === "loading" ? "Sending..." : "Send Reclamation"}
          </button>
          {reclamationState === "success" ? <p className="text-sm text-emerald-700">Reclamation sent.</p> : null}
          {reclamationState === "error" ? <p className="text-sm text-red-700">Could not send reclamation.</p> : null}
        </form>

        <form onSubmit={submitFeedback} className="card grid gap-3 p-6">
          <h2 className="font-mono text-xl font-semibold text-accent">Give Feedback</h2>
          <select
            name="rating"
            className="rounded-lg border border-slate-300 px-3 py-2"
            defaultValue="5"
            required
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Correct</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Very poor</option>
          </select>
          <input
            name="email"
            placeholder="Email (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <input
            name="appointmentReference"
            placeholder="RDV reference (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <textarea
            name="comment"
            placeholder="Your comments"
            className="min-h-28 rounded-lg border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-white disabled:bg-slate-400"
            disabled={feedbackState === "loading"}
          >
            {feedbackState === "loading" ? "Sending..." : "Submit Feedback"}
          </button>
          {feedbackState === "success" ? <p className="text-sm text-emerald-700">Feedback submitted.</p> : null}
          {feedbackState === "error" ? <p className="text-sm text-red-700">Could not submit feedback.</p> : null}
        </form>
      </section>
    </main>
  );
}
