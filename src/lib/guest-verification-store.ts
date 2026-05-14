import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export type GuestVerificationChannel = "SMS" | "EMAIL";

export type GuestVerificationSession = {
  id: string;
  token: string;
  contactChannel: GuestVerificationChannel;
  contactValue: string;
  verificationHash: string;
  verifiedAt: Date | null;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
};

type GuestVerificationCreateInput = {
  token: string;
  contactChannel: GuestVerificationChannel;
  contactValue: string;
  verificationHash: string;
  expiresAt: Date;
};

type GuestVerificationUpdateInput = {
  attempts?: {
    increment: number;
  };
  verifiedAt?: Date | null;
};

declare global {
  // eslint-disable-next-line no-var
  var guestVerificationSessions: Map<string, GuestVerificationSession> | undefined;
}

const guestVerificationSessions =
  global.guestVerificationSessions || new Map<string, GuestVerificationSession>();

if (!global.guestVerificationSessions) {
  global.guestVerificationSessions = guestVerificationSessions;
}

function cloneSession(session: GuestVerificationSession): GuestVerificationSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    expiresAt: new Date(session.expiresAt),
    verifiedAt: session.verifiedAt ? new Date(session.verifiedAt) : null,
  };
}

function isConnectionUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    cause?: unknown;
  };

  if (candidate.code === "ECONNREFUSED" || candidate.code === "P1001") {
    return true;
  }

  if (typeof candidate.message === "string" && candidate.message.includes("ECONNREFUSED")) {
    return true;
  }

  if (candidate.cause && typeof candidate.cause === "object") {
    const cause = candidate.cause as { code?: unknown; message?: unknown };

    if (cause.code === "ECONNREFUSED") {
      return true;
    }

    if (typeof cause.message === "string" && cause.message.includes("ECONNREFUSED")) {
      return true;
    }
  }

  return false;
}

function createInMemorySession(data: GuestVerificationCreateInput): GuestVerificationSession {
  return {
    id: crypto.randomUUID(),
    token: data.token,
    contactChannel: data.contactChannel,
    contactValue: data.contactValue,
    verificationHash: data.verificationHash,
    verifiedAt: null,
    attempts: 0,
    expiresAt: data.expiresAt,
    createdAt: new Date(),
  };
}

function applyUpdate(
  session: GuestVerificationSession,
  data: GuestVerificationUpdateInput
): GuestVerificationSession {
  const nextSession = cloneSession(session);

  if (data.attempts?.increment) {
    nextSession.attempts += data.attempts.increment;
  }

  if ("verifiedAt" in data) {
    nextSession.verifiedAt = data.verifiedAt ?? null;
  }

  return nextSession;
}

function shouldUseMemoryFallback(error: unknown): boolean {
  return process.env.NODE_ENV !== "production" && isConnectionUnavailable(error);
}

export async function createGuestVerificationSession(
  data: GuestVerificationCreateInput
): Promise<GuestVerificationSession> {
  try {
    return await prisma.guestSession.create({ data });
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    const session = createInMemorySession(data);
    guestVerificationSessions.set(session.token, session);
    console.warn("[VERIFICATION_SESSION_FALLBACK] Using in-memory guest verification session storage.");
    return cloneSession(session);
  }
}

export async function getGuestVerificationSession(
  token: string
): Promise<GuestVerificationSession | null> {
  try {
    const session = await prisma.guestSession.findUnique({ where: { token } });

    if (session) {
      return session;
    }
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }
  }

  const memorySession = guestVerificationSessions.get(token);
  return memorySession ? cloneSession(memorySession) : null;
}

export async function updateGuestVerificationSession(
  token: string,
  data: GuestVerificationUpdateInput
): Promise<GuestVerificationSession | null> {
  try {
    const existingSession = await prisma.guestSession.findUnique({ where: { token } });

    if (existingSession) {
      return await prisma.guestSession.update({ where: { token }, data });
    }
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }
  }

  const memorySession = guestVerificationSessions.get(token);

  if (!memorySession) {
    return null;
  }

  const updatedSession = applyUpdate(memorySession, data);
  guestVerificationSessions.set(token, updatedSession);
  return cloneSession(updatedSession);
}

export async function deleteGuestVerificationSession(token: string): Promise<void> {
  try {
    const existingSession = await prisma.guestSession.findUnique({ where: { token } });

    if (existingSession) {
      await prisma.guestSession.delete({ where: { token } });
      return;
    }
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }
  }

  guestVerificationSessions.delete(token);
}