import { addMinutes } from "date-fns";
import { AppointmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function hasAppointmentConflict(carId: string, scheduledAt: Date) {
  const windowEnd = addMinutes(scheduledAt, 120);
  const windowStart = addMinutes(scheduledAt, -120);

  const conflict = await prisma.appointment.findFirst({
    where: {
      carId,
      status: {
        in: [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS],
      },
      scheduledAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
  });

  return Boolean(conflict);
}
