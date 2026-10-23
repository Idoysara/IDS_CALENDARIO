/**
 * Generador de Invitaciones de Calendario en formato estándar iCalendar (RFC 5545 - .ics)
 * Compatible con Google Calendar, Microsoft Outlook, Apple Mail y Yahoo.
 */

export interface CalendarInviteOptions {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendees: Array<{ name?: string; email: string }>;
  meetLink?: string;
}

export function generateICS(options: CalendarInviteOptions): string {
  const {
    title,
    description = "",
    location = "",
    startTime,
    endTime,
    organizerName = "Ismael Doy",
    organizerEmail = "citas@openghl.com",
    attendees,
    meetLink,
  } = options;

  const formatDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const now = formatDate(new Date());
  const dtStart = formatDate(startTime);
  const dtEnd = formatDate(endTime);
  const uid = `openghl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@openghl.local`;

  let fullDesc = description;
  if (meetLink) {
    fullDesc += `\\n\\nEnlace de Google Meet: ${meetLink}`;
  }

  const attendeesLines = attendees
    .map(
      (a) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${
          a.name || a.email
        }:mailto:${a.email}`
    )
    .join("\r\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "PRODID:-//OpenGHL//Sistema Autonomo de Negocios//ES",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${fullDesc.replace(/\n/g, "\\n")}`,
    `LOCATION:${location || (meetLink ? "Google Meet" : "Oficina")}`,
    `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
    attendeesLines,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio de Cita",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
}
