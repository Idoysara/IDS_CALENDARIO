import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchWorkflowEvent } from "@/lib/workflows/dispatcher";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get("calendarId");

    const where: any = {};
    if (calendarId) {
      where.calendarId = calendarId;
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        contact: true,
        calendar: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (err: any) {
    console.error("Error fetching appointments:", err);
    return NextResponse.json({ appointments: [], error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      startTime,
      endTime,
      notes,
      contactName,
      contactEmail,
      contactPhone,
      calendarId: providedCalId,
    } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "startTime and endTime are required" },
        { status: 400 }
      );
    }

    // 1. Obtener o crear calendario por defecto
    let calendarId = providedCalId;
    let locationId = "loc_live_proof_01";

    if (!calendarId) {
      const defaultCal = await db.calendar.findFirst();
      if (defaultCal) {
        calendarId = defaultCal.id;
        locationId = defaultCal.locationId;
      } else {
        const defaultLoc =
          (await db.location.findFirst()) ||
          (await db.location.create({
            data: { id: locationId, name: "Sede Principal" },
          }));
        const newCal = await db.calendar.create({
          data: {
            name: "Agenda Principal",
            locationId: defaultLoc.id,
            durationMinutes: 45,
          },
        });
        calendarId = newCal.id;
        locationId = defaultLoc.id;
      }
    }

    // 2. Obtener o crear contacto
    let contactId = body.contactId;
    if (!contactId) {
      const nameParts = (contactName || "Invitado Comercial").split(" ");
      const firstName = nameParts[0] || "Invitado";
      const lastName = nameParts.slice(1).join(" ") || "";

      const contact = await db.contact.create({
        data: {
          locationId,
          firstName,
          lastName,
          email: contactEmail || null,
          phone: contactPhone || null,
          tags: JSON.stringify(["cita-agendada", "calendario-web"]),
        },
      });
      contactId = contact.id;
    }

    // 3. Crear Cita
    const effectiveTitle = (title || "").trim() || "Reunión comercial";
    let noteContent = notes ? notes.trim() : "";
    if (!noteContent.includes("Título:")) {
      noteContent = `Título: ${effectiveTitle}\n${noteContent}`.trim();
    }

    const appointment = await db.appointment.create({
      data: {
        calendarId,
        contactId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "CONFIRMED",
        notes: noteContent,
      },
      include: {
        contact: true,
        calendar: true,
      },
    });

    // 4. Emitir evento reactivo de workflow (con envío automático de correos)
    await dispatchWorkflowEvent("APPOINTMENT_BOOKED", {
      locationId,
      contactId,
      appointmentId: appointment.id,
      metadata: {
        title,
        startTime,
        endTime,
        notes: noteContent,
        guests: body.guests || [],
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
