import type { Metadata } from "next";
import "./globals.css";
import { Calendar, Video, Mail, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "IDS Calendario - Sistema Autónomo de Agendamiento",
  description: "Paridad Google Calendar con motor de citas, detección de colisiones, RFC 5545 iCalendar y notificaciones automáticas por correo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
        {/* Barra Superior Exclusiva de IDS Calendario */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Logo de IDS Calendario */}
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-slate-900">
                      IDS Calendario
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Autónomo (3001)
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2">
              <a
                href="/api/email/test?to=demo@empresa.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Correo</span>
              </a>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                v1.0 Standalone
              </span>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
