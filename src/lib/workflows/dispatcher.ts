import { db } from "../db";
import { generateICS } from "../calendar/ics";
import { sendEmail, buildAppointmentEmailHtml } from "../email/sender";

export type WorkflowEventType =
  | "APPOINTMENT_BOOKED"
  | "CONTACT_CREATED"
  | "OPPORTUNITY_UPDATED"
  | "GHL_SYNC_COMPLETED";

export interface WorkflowEventPayload {
  locationId: string;
  contactId?: string;
  opportunityId?: string;
  appointmentId?: string;
  metadata?: Record<string, any>;
  stats?: Record<string, any>;
  importedAt?: string;
}

export async function dispatchWorkflowEvent(
  eventType: WorkflowEventType,
  payload: WorkflowEventPayload
) {
  try {
    // 1. Manejo Automático de Envío de Invitaciones de Citas
    if (eventType === "APPOINTMENT_BOOKED" && payload.appointmentId) {
      await handleAppointmentBookingEmails(payload);
    }

    // 2. Ejecutar flujos reactivos configurados en base de datos
    const activeWorkflows = await db.workflow.findMany({
      where: {
        locationId: payload.locationId,
        triggerType: eventType,
        isActive: true,
      },
    });

    console.log(
      `[Workflow Engine] Dispatched ${eventType} for contact ${payload.contactId}. Matched: ${activeWorkflows.length} workflows.`
    );

    for (const wf of activeWorkflows) {
      let actions: any[] = [];
      try {
        actions = JSON.parse(wf.actionsJson);
      } catch (err) {
        console.error(`Invalid actionsJson in workflow ${wf.id}:`, err);
        continue;
      }

      for (const action of actions) {
        await executeAction(action, payload);
      }
    }
  } catch (err) {
    console.error("[Workflow Engine] Execution error:", err);
  }
}

/**
 * Despacho automático de invitaciones por correo al agendar una cita
 */
async function handleAppointmentBookingEmails(payload: WorkflowEventPayload) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id: payload.appointmentId },
      include: { contact: true, calendar: true },
    });

    if (!appointment) return;

    // Recolectar correos de participantes
    const recipientEmails: string[] = [];

    if (appointment.contact?.email) {
      recipientEmails.push(appointment.contact.email);
    }

    if (Array.isArray(payload.metadata?.guests)) {
      for (const g of payload.metadata.guests) {
        if (typeof g === "string" && g.includes("@") && !recipientEmails.includes(g)) {
          recipientEmails.push(g);
        }
      }
    }

    if (recipientEmails.length === 0) {
      console.log("[Workflow Engine] No recipient emails found for appointment invitation.");
      return;
    }

    const title = payload.metadata?.title || appointment.notes?.split("\n")[0] || "Cita Comercial Confirmada";
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    // 1. Generar archivo estándar RFC 5545 iCalendar (.ics)
    const icsContent = generateICS({
      title,
      description: appointment.notes || "Reunión agendada a través del sistema OpenGHL",
      location: "Google Meet / Presencial",
      startTime,
      endTime,
      organizerName: "Ismael Doy",
      organizerEmail: process.env.SMTP_USER || "citas@openghl.com",
      attendees: recipientEmails.map((email) => ({ email })),
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    // 2. Construir cuerpo HTML profesional
    const html = buildAppointmentEmailHtml({
      title,
      dateStr: startTime.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeStr: `${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      meetLink: "https://meet.google.com/abc-defg-hij",
      location: "Planta baja de Los Palos Grandes / Remoto",
      description: appointment.notes || "",
      hostName: "Ismael Doy",
    });

    // 3. Despachar a través del motor de correo (Resend / SMTP / Simulado)
    const emailResult = await sendEmail({
      to: recipientEmails,
      subject: `Confirmación de Cita: ${title}`,
      html,
      icsContent,
    });

    console.log(`[Workflow Engine] Email Dispatch Result:`, emailResult);
  } catch (err: any) {
    console.error(`[Workflow Engine] Error dispatching appointment email:`, err.message);
  }
}

async function executeAction(action: any, payload: WorkflowEventPayload) {
  switch (action.type) {
    case "UPDATE_STAGE": {
      if (payload.opportunityId && action.targetStageId) {
        await db.opportunity.update({
          where: { id: payload.opportunityId },
          data: { stageId: action.targetStageId },
        });
        console.log(
          `[Workflow Action] Opportunity ${payload.opportunityId} moved to stage ${action.targetStageId}`
        );
      }
      break;
    }

    case "ADD_TAG": {
      if (action.tag && payload.contactId) {
        const contact = await db.contact.findUnique({
          where: { id: payload.contactId },
        });
        if (contact) {
          let currentTags: string[] = [];
          try {
            currentTags = JSON.parse(contact.tags);
          } catch {
            currentTags = [];
          }
          if (!currentTags.includes(action.tag)) {
            currentTags.push(action.tag);
            await db.contact.update({
              where: { id: payload.contactId },
              data: { tags: JSON.stringify(currentTags) },
            });
            console.log(
              `[Workflow Action] Tag "${action.tag}" added to contact ${payload.contactId}`
            );
          }
        }
      }
      break;
    }

    case "SEND_EMAIL": {
      if (action.to || payload.contactId) {
        let recipient = action.to;
        if (!recipient && payload.contactId) {
          const c = await db.contact.findUnique({ where: { id: payload.contactId } });
          recipient = c?.email;
        }
        if (recipient) {
          await sendEmail({
            to: recipient,
            subject: action.subject || "Notificación de OpenGHL",
            html: action.html || "<p>Notificación automática del sistema.</p>",
          });
        }
      }
      break;
    }

    case "LOG_INTERNAL_TASK": {
      console.log(
        `[Workflow Action] Tarea interna creada: "${action.title || "Preparar visita"}" para el contacto ${payload.contactId}`
      );
      break;
    }

    default:
      console.log(`[Workflow Action] Unknown action type: ${action.type}`);
  }
}

export const emitWorkflowEvent = dispatchWorkflowEvent;
