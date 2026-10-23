import { NextResponse } from "next/server";
import { sendEmail, buildAppointmentEmailHtml } from "@/lib/email/sender";
import { generateICS } from "@/lib/calendar/ics";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTo = searchParams.get("to") || "";
    // Limpiar caracteres accidentales como espacios o paréntesis
    const cleanTo = rawTo.replace(/[()\s]/g, "").trim() || "tu-correo@gmail.com";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTomorrow = new Date(tomorrow);
    endTomorrow.setMinutes(endTomorrow.getMinutes() + 45);

    const title = "Reunión de Demostración OpenGHL";
    const icsContent = generateICS({
      title,
      description: "Prueba oficial del sistema automático de correos de OpenGHL con archivo iCalendar (.ics).",
      location: "Google Meet / Lex, El Rosal",
      startTime: tomorrow,
      endTime: endTomorrow,
      organizerName: "Ismael Doy",
      organizerEmail: process.env.SMTP_USER || "citas@openghl.com",
      attendees: [{ email: cleanTo }],
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    const htmlBody = buildAppointmentEmailHtml({
      title,
      dateStr: tomorrow.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      timeStr: "10:00 - 10:45",
      meetLink: "https://meet.google.com/abc-defg-hij",
      location: "Lex, El Rosal / Remoto",
      description: "Esta es una prueba de envío automático generada desde OpenGHL con el archivo .ics adjunto para Google Calendar y Outlook.",
      hostName: "Ismael Doy",
    });

    const result = await sendEmail({
      to: cleanTo,
      subject: `[Prueba OpenGHL] ${title}`,
      html: htmlBody,
      icsContent,
    });

    // Detectar si el usuario abrió la URL en el navegador (Chrome)
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      const isSimulated = result.provider === "simulated";
      const isReal = result.provider === "resend" || result.provider === "smtp";

      const htmlResponse = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Diagnóstico de Correo - OpenGHL</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 text-slate-800 font-sans min-h-screen p-4 md:p-8">
        <div class="max-w-2xl mx-auto space-y-6">
          <!-- Tarjeta de Diagnóstico -->
          <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                isReal ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }">
                ${isReal ? "● Conexión Real Activa" : "○ Modo Simulación Seguro"}
              </span>
              <a href="/calendar" class="text-xs font-semibold text-blue-600 hover:underline">← Volver al Calendario</a>
            </div>

            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              Prueba de Envío Automático de Citas
            </h1>
            <p class="text-slate-600 text-sm mb-6">
              El motor de invitaciones ha generado el evento, el archivo universal <strong class="text-slate-800">.ics</strong> y el formato de correo para <strong class="text-slate-800">${cleanTo}</strong>.
            </p>

            <!-- Formulario Rápido para Enviar a otro correo -->
            <form method="GET" action="/api/email/test" class="flex gap-2 mb-6">
              <input
                type="email"
                name="to"
                value="${cleanTo === "tu-correo@gmail.com" ? "" : cleanTo}"
                placeholder="Escribe tu correo real (ej: tu@gmail.com)"
                required
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Probar Envío
              </button>
            </form>

            <!-- Estado Técnico Detallado -->
            <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Proveedor Utilizado:</span>
                <span class="font-bold text-slate-800 uppercase">${result.provider}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Destinatario:</span>
                <span class="font-mono text-slate-800 font-bold">${cleanTo}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Adjunto iCalendar (RFC 5545):</span>
                <span class="text-emerald-700 font-bold">✓ Generado (invitacion-cita.ics)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 font-medium">Videoconferencia:</span>
                <span class="text-blue-700 font-bold">✓ Google Meet activo</span>
              </div>
            </div>
          </div>

          <!-- Guía para Activar el Envío Real -->
          <div class="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <h2 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🚀</span> Cómo activar el envío real a tu bandeja de entrada
            </h2>
            <p class="text-sm text-slate-600 mb-4">
              Para que los correos salgan de verdad a los buzones de tus clientes, solo abre tu archivo <code class="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">.env</code> y elige una de estas dos opciones gratuitas:
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <!-- Opción A: Resend -->
              <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                <div>
                  <span class="font-bold text-blue-900 text-sm block mb-1">Opción A: Resend (Recomendada)</span>
                  <p class="text-blue-800/80 mb-3">3.000 correos al mes gratis. Entrega instantánea sin caer en spam.</p>
                  <ol class="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Entra en <a href="https://resend.com" target="_blank" class="text-blue-600 font-bold hover:underline">resend.com</a> y crea cuenta gratis.</li>
                    <li>Copia tu API Key (<code class="bg-white px-1 rounded border">re_...</code>).</li>
                    <li>Pégala en tu archivo <code class="bg-white px-1 rounded border">.env</code>.</li>
                  </ol>
                </div>
              </div>

              <!-- Opción B: Gmail -->
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span class="font-bold text-slate-900 text-sm block mb-1">Opción B: Tu cuenta de Gmail</span>
                  <p class="text-slate-600 mb-3">500 correos al día gratis enviados directamente desde tu dirección.</p>
                  <ol class="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Ve a <a href="https://myaccount.google.com/apppasswords" target="_blank" class="text-blue-600 font-bold hover:underline">Google App Passwords</a>.</li>
                    <li>Genera una contraseña de aplicación de 16 letras.</li>
                    <li>Pega tu usuario y esa contraseña en <code class="bg-white px-1 rounded border">.env</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
      `;

      return new NextResponse(htmlResponse, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Respuesta JSON si se consume vía API
    return NextResponse.json({
      success: result.success,
      result,
      recipient: cleanTo,
      info: "Para enviar correos reales, añade RESEND_API_KEY o SMTP_USER/SMTP_PASS en tu archivo .env",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
