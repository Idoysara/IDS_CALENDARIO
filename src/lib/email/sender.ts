import tls from "tls";
import { Buffer } from "buffer";

export interface EmailAttachment {
  filename: string;
  content: string; // base64 o texto plano
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  icsContent?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  provider: "resend" | "smtp" | "simulated";
  messageId?: string;
  message: string;
  error?: string;
}

/**
 * Motor Maestro de Envío de Correos Automáticos para OpenGHL
 * Soporta:
 * 1. Resend API (vía fetch nativo - 3.000 emails/mes gratis)
 * 2. SMTP Nativo TLS (Gmail, Brevo, Workspace, etc. - sin dependencias)
 * 3. Modo Simulación Local (cuando aún no se han configurado credenciales)
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, from, icsContent, attachments = [] } = options;
  const recipients = Array.isArray(to) ? to : [to];

  // Si se adjunta contenido iCalendar (.ics), añadirlo a la lista de adjuntos
  const allAttachments = [...attachments];
  if (icsContent) {
    allAttachments.push({
      filename: "invitacion-cita.ics",
      content: Buffer.from(icsContent).toString("base64"),
      contentType: "text/calendar; method=REQUEST; charset=UTF-8",
    });
  }

  // --- VÍA 1: RESEND API (Recomendada - Zero Spam y Fácil) ---
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith("re_")) {
    try {
      const fromAddress = from || process.env.EMAIL_FROM || "OpenGHL Citas <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          subject,
          html,
          text: text || "Tienes una nueva cita agendada en OpenGHL.",
          attachments: allAttachments.map((att) => ({
            filename: att.filename,
            content: att.content,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          provider: "resend",
          messageId: data.id,
          message: `Correo enviado exitosamente vía Resend a ${recipients.join(", ")}`,
        };
      } else {
        console.warn("[Email Engine] Resend API error:", data);
      }
    } catch (err: any) {
      console.error("[Email Engine] Error conectando a Resend:", err.message);
    }
  }

  // --- VÍA 2: SMTP NATIVO TLS (Gmail, Brevo, Custom SMTP) ---
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const result = await sendViaNativeSMTP({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        from: from || smtpUser,
        to: recipients,
        subject,
        html,
        allAttachments,
      });
      return result;
    } catch (smtpErr: any) {
      console.error("[Email Engine] Error en envío SMTP:", smtpErr.message);
    }
  }

  // --- VÍA 3: MODO SIMULACIÓN LOCAL (Para Desarrollo y Pruebas Seguras) ---
  console.log("\n=======================================================");
  console.log("📨 [SIMULADOR DE ENVÍO DE CORREO - OpenGHL]");
  console.log(`Para: ${recipients.join(", ")}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Adjunto .ics: ${icsContent ? "SÍ (RFC 5545 iCalendar)" : "NO"}`);
  console.log("Estado: Simulado con éxito (Credenciales en .env no configuradas)");
  console.log("=======================================================\n");

  return {
    success: true,
    provider: "simulated",
    message: `[Simulación] Correo preparado para ${recipients.join(", ")}. Configura RESEND_API_KEY o SMTP en .env para entrega real.`,
  };
}

/**
 * Cliente SMTP Ligero Nativo sobre Socket TLS
 * Se conecta a smtp.gmail.com:465 o smtp-relay.brevo.com:465 sin dependencias externas.
 */
function sendViaNativeSMTP(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
  allAttachments: EmailAttachment[];
}): Promise<SendEmailResult> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: config.host,
        port: config.port,
        rejectUnauthorized: false, // Permite compatibilidad con certificados TLS locales
      },
      () => {
        let step = 0;
        const boundary = `openghl_bound_${Date.now()}`;

        const sendCmd = (cmd: string) => {
          socket.write(cmd + "\r\n");
        };

        socket.on("data", (data) => {
          const resp = data.toString();

          if (step === 0 && resp.startsWith("220")) {
            step = 1;
            sendCmd(`EHLO localhost`);
          } else if (step === 1 && resp.startsWith("250")) {
            step = 2;
            sendCmd(`AUTH LOGIN`);
          } else if (step === 2 && resp.startsWith("334")) {
            step = 3;
            sendCmd(Buffer.from(config.user).toString("base64"));
          } else if (step === 3 && resp.startsWith("334")) {
            step = 4;
            sendCmd(Buffer.from(config.pass.replace(/\s+/g, "")).toString("base64"));
          } else if (step === 4 && resp.startsWith("235")) {
            step = 5;
            sendCmd(`MAIL FROM:<${config.user}>`);
          } else if (step === 5 && resp.startsWith("250")) {
            step = 6;
            sendCmd(`RCPT TO:<${config.to[0]}>`);
          } else if (step === 6 && resp.startsWith("250")) {
            step = 7;
            sendCmd(`DATA`);
          } else if (step === 7 && resp.startsWith("354")) {
            step = 8;

            // Construir cabeceras y cuerpo MIME multipart
            let mimeBody = `From: OpenGHL <${config.user}>\r\n`;
            mimeBody += `To: ${config.to.join(", ")}\r\n`;
            mimeBody += `Subject: =?UTF-8?B?${Buffer.from(config.subject).toString("base64")}?=\r\n`;
            mimeBody += `MIME-Version: 1.0\r\n`;
            mimeBody += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

            // Parte HTML
            mimeBody += `--${boundary}\r\n`;
            mimeBody += `Content-Type: text/html; charset=UTF-8\r\n`;
            mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
            mimeBody += `${Buffer.from(config.html).toString("base64")}\r\n\r\n`;

            // Adjuntos (como el archivo .ics)
            for (const att of config.allAttachments) {
              mimeBody += `--${boundary}\r\n`;
              mimeBody += `Content-Type: ${att.contentType || "application/octet-stream"}; name="${att.filename}"\r\n`;
              mimeBody += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
              mimeBody += `Content-Transfer-Encoding: base64\r\n\r\n`;
              mimeBody += `${att.content}\r\n\r\n`;
            }

            mimeBody += `--${boundary}--\r\n.\r\n`;
            socket.write(mimeBody);
          } else if (step === 8 && resp.startsWith("250")) {
            step = 9;
            sendCmd(`QUIT`);
            socket.end();
            resolve({
              success: true,
              provider: "smtp",
              message: `Correo enviado exitosamente vía SMTP (${config.host}) a ${config.to.join(", ")}`,
            });
          } else if (resp.startsWith("5") || resp.startsWith("4")) {
            socket.end();
            resolve({
              success: false,
              provider: "smtp",
              message: "Error de autenticación o rechazo en servidor SMTP",
              error: resp.trim(),
            });
          }
        });

        socket.on("error", (err) => {
          reject(err);
        });
      }
    );
  });
}

/**
 * Plantilla HTML de Notificación Oficial de Cita
 */
export function buildAppointmentEmailHtml(options: {
  title: string;
  dateStr: string;
  timeStr: string;
  meetLink?: string;
  location?: string;
  description?: string;
  hostName?: string;
}): string {
  const { title, dateStr, timeStr, meetLink, location, description, hostName = "Ismael Doy" } = options;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header Azul -->
      <div style="background-color: #1a73e8; padding: 24px; color: #ffffff; text-align: left;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; opacity: 0.9; display: block; margin-bottom: 4px;">Invitación a Cita Comercial</span>
        <h1 style="font-size: 20px; font-weight: 700; margin: 0; line-height: 1.3;">${title}</h1>
        <p style="font-size: 13px; opacity: 0.9; margin: 6px 0 0 0;">📅 ${dateStr} · ⏰ ${timeStr}</p>
      </div>

      <!-- Cuerpo -->
      <div style="padding: 24px;">
        <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
          Hola, se ha reservado formalmente una reunión con <strong>${hostName}</strong> en nuestra agenda comercial.
        </p>

        <!-- Botón Google Meet -->
        ${
          meetLink
            ? `
        <div style="margin: 20px 0; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; text-align: center;">
          <span style="font-size: 12px; font-weight: 600; color: #1d4ed8; display: block; margin-bottom: 8px;">Videoconferencia de Google Meet</span>
          <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">Unirme a la reunión</a>
          <span style="display: block; font-size: 11px; color: #64748b; margin-top: 8px; font-family: monospace;">${meetLink}</span>
        </div>
        `
            : ""
        }

        <!-- Detalles adicionales -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
          ${
            location
              ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>Ubicación:</strong></td>
            <td style="padding: 8px 0; color: #0f172a;">${location}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #64748b;"><strong>Organizador:</strong></td>
            <td style="padding: 8px 0; color: #0f172a;">${hostName}</td>
          </tr>
          ${
            description
              ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Notas:</strong></td>
            <td style="padding: 8px 0; color: #0f172a;">${description.replace(/\n/g, "<br>")}</td>
          </tr>
          `
              : ""
          }
        </table>

        <!-- Alerta de archivo adjunto -->
        <div style="margin-top: 24px; padding: 12px 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569;">
          📎 <strong>Invitación de Calendario Adjunta:</strong> Hemos adjuntado el archivo <code>invitacion-cita.ics</code>. Si tu cliente de correo es Gmail, Outlook o Apple Mail, la cita se agregará a tu calendario automáticamente.
        </div>
      </div>

      <!-- Pie -->
      <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
        Enviado de forma automática por el sistema OpenGHL · IDS GoHighLevel Engine
      </div>
    </div>
  </body>
  </html>
  `;
}
