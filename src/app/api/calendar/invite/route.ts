import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateICS } from "@/lib/calendar/ics";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    const app = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { contact: true, calendar: true },
    });

    if (!app) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const icsContent = generateICS({
      title: app.notes?.split("\n")[0] || "Cita Comercial",
      description: app.notes || "Reunión agendada a través de OpenGHL",
      startTime: new Date(app.startTime),
      endTime: new Date(app.endTime),
      organizerName: "Ismael Doy",
      organizerEmail: "citas@openghl.com",
      attendees: [
        {
          name: `${app.contact.firstName} ${app.contact.lastName || ""}`.trim(),
          email: app.contact.email || "participante@empresa.com",
        },
      ],
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="invitacion-cita-${app.id.slice(0, 8)}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
