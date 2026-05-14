import { VerificationChannel } from "@/generated/prisma/enums";
import { z } from "zod";

export const vehicleSchema = z.object({
  vin: z.string().min(17).max(17),
  matricule: z.string().min(2).max(20).optional().or(z.literal("")),
  isForeign: z.boolean().default(false),
});

export const guestVerificationStartSchema = z.object({
  vehicle: vehicleSchema,
  channel: z.nativeEnum(VerificationChannel),
  contactValue: z.string().min(5).max(100),
});

export const guestVerificationConfirmSchema = z.object({
  token: z.string().min(10),
  code: z.string().length(6),
});

export const guestAppointmentSchema = z.object({
  token: z.string().min(10),
  serviceId: z.string().cuid(),
  agencyId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  vehicle: vehicleSchema,
});

export const trackSchema = z
  .object({
    reference: z.string().optional(),
    vin: z.string().length(17).optional(),
    matricule: z.string().optional(),
  })
  .refine((value) => Boolean(value.reference) || Boolean(value.vin) || Boolean(value.matricule), {
    message: "Provide appointment reference, VIN, or matricule",
  });

export const reclamationSchema = z.object({
  fullName: z.string().min(3).max(80),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
  message: z.string().min(10).max(1000),
  appointmentReference: z.string().optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(800).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(6).max(20).optional().or(z.literal("")),
  appointmentReference: z.string().optional(),
});

export const mobileProfileSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  fullName: z.string().max(80).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export const mobileCarSchema = z.object({
  vin: z.string().length(17),
  matricule: z.string().min(2).max(20).optional().or(z.literal("")),
  isForeign: z.boolean().default(false),
});

export const mobileAppointmentSchema = z.object({
  carId: z.string().cuid(),
  serviceId: z.string().cuid(),
  agencyId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});
