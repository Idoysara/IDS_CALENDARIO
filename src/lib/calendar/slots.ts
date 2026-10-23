import { db } from "../db";

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  display: string;   // "11:00 AM - 11:45 AM"
}

export async function getAvailableSlots(
  calendarId: string,
  targetDate: Date
): Promise<TimeSlot[]> {
  const calendar = await db.calendar.findUnique({
    where: { id: calendarId },
  });

  if (!calendar) {
    throw new Error("Calendar not found");
  }

  // Verificar si el día de la semana está habilitado (0 = Domingo, 1 = Lunes, ...)
  const dayOfWeek = targetDate.getDay();
  let workingDays: number[] = [1, 2, 3, 4, 5];
  try {
    workingDays = JSON.parse(calendar.workingDays);
  } catch (e) {
    workingDays = [1, 2, 3, 4, 5];
  }

  if (!workingDays.includes(dayOfWeek)) {
    return []; // Cerrado este día
  }

  // Rango del día
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(calendar.startHour, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(calendar.endHour, 0, 0, 0);

  // Obtener citas existentes en esa fecha
  const existingAppointments = await db.appointment.findMany({
    where: {
      calendarId,
      status: { notIn: ["CANCELLED"] },
      startTime: { gte: new Date(targetDate.setHours(0, 0, 0, 0)) },
      endTime: { lte: new Date(targetDate.setHours(23, 59, 59, 999)) },
    },
  });

  const slots: TimeSlot[] = [];
  const durationMs = calendar.durationMinutes * 60 * 1000;
  const bufferMs = calendar.bufferMinutes * 60 * 1000;
  const totalSlotMs = durationMs + bufferMs;

  let currentPointer = new Date(startOfDay).getTime();
  const limitPointer = endOfDay.getTime();

  while (currentPointer + durationMs <= limitPointer) {
    const slotStart = new Date(currentPointer);
    const slotEnd = new Date(currentPointer + durationMs);

    // Comprobar si choca con alguna cita existente
    const hasCollision = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.startTime).getTime();
      const apptEnd = new Date(appt.endTime).getTime();
      // Hay solapamiento si slotStart < apptEnd && slotEnd > apptStart
      return slotStart.getTime() < apptEnd && slotEnd.getTime() > apptStart;
    });

    if (!hasCollision) {
      const formatTime = (d: Date) =>
        d.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        display: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
      });
    }

    currentPointer += totalSlotMs;
  }

  return slots;
}
