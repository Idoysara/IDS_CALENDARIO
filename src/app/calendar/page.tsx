"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Settings,
  Plus,
  X,
  Video,
  MapPin,
  Bell,
  User,
  Users,
  Check,
  CheckSquare,
  Trash2,
  Lightbulb,
  CheckCircle2,
  Clock,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  Copy,
  ExternalLink,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Appointment {
  id: string;
  calendarId: string;
  contactId: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  contact?: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

interface NotificationItem {
  id: string;
  type: "email" | "popup";
  minutes: number;
}

export default function GoogleCalendarPage() {
  // Estado de fecha activa
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 22)); // 22 Oct 2026
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Citas y carga
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal de Crear Evento (Template Imagen 4)
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<"details" | "slots">("details");
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalDate, setModalDate] = useState<string>("2026-10-22");
  const [modalStartTime, setModalStartTime] = useState<string>("09:00");
  const [modalEndTime, setModalEndTime] = useState<string>("10:00");
  const [isAllDay, setIsAllDay] = useState<boolean>(false);
  const [repeatOption, setRepeatOption] = useState<string>("no_repeat");

  // Campos interactivos del evento
  const [modalHasMeet, setModalHasMeet] = useState<boolean>(true);
  const [meetLinkCopied, setMeetLinkCopied] = useState<boolean>(false);
  const [modalLocation, setModalLocation] = useState<string>("");
  const [modalDescription, setModalDescription] = useState<string>("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", type: "email", minutes: 10 },
  ]);
  const [selectedCalendarColor, setSelectedCalendarColor] = useState<string>("blue");
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("busy");
  const [visibilityOption, setVisibilityOption] = useState<string>("default");

  // Invitados y permisos
  const [guestInput, setGuestInput] = useState<string>("");
  const [guests, setGuests] = useState<string[]>(["juan.andres@matrix.com"]);
  const [permModify, setPermModify] = useState<boolean>(false);
  const [permInviteOthers, setPermInviteOthers] = useState<boolean>(true);
  const [permSeeGuestList, setPermSeeGuestList] = useState<boolean>(true);

  // Modal de Detalle / Inspección de Evento Existente
  const [inspectModalOpen, setInspectModalOpen] = useState<boolean>(false);
  const [activeInspectEvent, setActiveInspectEvent] = useState<any>(null);

  // Filtros de calendarios activos en el sidebar
  const [calIsmael, setCalIsmael] = useState<boolean>(true);
  const [calCumpleanos, setCalCumpleanos] = useState<boolean>(true);
  const [calTasks, setCalTasks] = useState<boolean>(true);
  const [calFestivos, setCalFestivos] = useState<boolean>(true);

  // Bloquear scroll de fondo cuando cualquier modal está abierto
  useEffect(() => {
    if (modalOpen || inspectModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, inspectModalOpen]);

  // Cargar citas desde la API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar/events");
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error al cargar citas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Mostrar mensaje Toast de retroalimentación
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Eventos de muestra iniciales fijos (de las imágenes de referencia)
  const defaultEvents = useMemo(() => [
    {
      id: "ev_def_1",
      title: "Reunión con Juan Andrés de Matrix",
      location: "Planta baja de Los Palos Grandes",
      dateStr: "2026-10-22",
      startTimeStr: "08:00",
      endTimeStr: "09:30",
      startHour: 8,
      startMin: 0,
      durationHours: 1.5,
      color: "bg-blue-600 text-white",
      calendar: "Ismael Doy",
      meetLink: "https://meet.google.com/jua-andr-mat",
      description: "Revisión técnica de la integración de Matrix y acuerdos de despliegue.",
      guests: ["juan.andres@matrix.com", "ismael@ids.com"],
    },
    {
      id: "ev_def_2",
      title: "Reunión con Luis Pérez",
      location: "Lex, El Rosal",
      dateStr: "2026-10-22",
      startTimeStr: "11:00",
      endTimeStr: "12:00",
      startHour: 11,
      startMin: 0,
      durationHours: 1,
      color: "bg-blue-600 text-white",
      calendar: "Ismael Doy",
      meetLink: "https://meet.google.com/lui-perez-lex",
      description: "Revisión contractual de consultoría y cronograma de fases.",
      guests: ["luis.perez@lex.com"],
    },
    {
      id: "ev_def_3",
      title: "Seguimiento",
      location: "Remoto",
      dateStr: "2026-10-01",
      startTimeStr: "11:30",
      endTimeStr: "12:30",
      startHour: 11,
      startMin: 30,
      durationHours: 1,
      color: "bg-sky-100 text-sky-800 border border-sky-300",
      calendar: "Tasks",
      description: "Seguimiento semanal de tareas pendientes.",
      guests: [],
    },
    {
      id: "ev_def_4",
      title: "Día de la Raza",
      location: "Festivo Nacional",
      dateStr: "2026-10-12",
      startTimeStr: "00:00",
      endTimeStr: "23:59",
      startHour: 0,
      startMin: 0,
      durationHours: 24,
      color: "bg-teal-600 text-white",
      calendar: "Festivos",
      description: "Día festivo no laborable.",
      guests: [],
    },
    {
      id: "ev_def_5",
      title: "Halloween",
      location: "Celebración",
      dateStr: "2026-10-31",
      startTimeStr: "00:00",
      endTimeStr: "23:59",
      startHour: 0,
      startMin: 0,
      durationHours: 24,
      color: "bg-emerald-700 text-white",
      calendar: "Festivos",
      description: "Celebración anual.",
      guests: [],
    },
  ], []);

  // Fecha activa formateada YYYY-MM-DD
  const currentDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const d = currentDate.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  // Citas procesadas y normalizadas desde SQLite
  const parsedAppointments = useMemo(() => {
    return appointments.map((a) => {
      const start = new Date(a.startTime);
      const end = new Date(a.endTime);

      const rawNotes = a.notes || "";
      const lines = rawNotes.split("\n");
      let title = "";
      let location = "";
      let meetLink = "";
      let guestsList: string[] = [];
      const descLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("Título: ")) {
          title = line.replace("Título: ", "").trim();
        } else if (line.startsWith("Evento: ")) {
          title = line.replace("Evento: ", "").trim();
        } else if (line.startsWith("Ubicación: ")) {
          location = line.replace("Ubicación: ", "").trim();
        } else if (line.startsWith("Google Meet: ")) {
          meetLink = line.replace("Google Meet: ", "").trim();
        } else if (line.startsWith("Invitados: ")) {
          guestsList = line
            .replace("Invitados: ", "")
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean);
        } else {
          descLines.push(line);
        }
      }

      if (!title) {
        title = a.contact?.firstName
          ? `Reunión con ${a.contact.firstName} ${a.contact.lastName || ""}`.trim()
          : "Cita Comercial";
      }

      if (guestsList.length === 0 && a.contact?.email) {
        guestsList.push(a.contact.email);
      }

      const durationMinutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      );
      const startHour = start.getHours();
      const startMin = start.getMinutes();

      const formatTime = (d: Date) => {
        return d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      };

      const startYear = start.getFullYear();
      const startMonth = start.getMonth();
      const startDate = start.getDate();

      return {
        id: a.id,
        title,
        location: location || "Oficina / Enlace virtual",
        meetLink: meetLink || "https://meet.google.com/abc-defg-hij",
        description: descLines.join("\n").trim() || rawNotes,
        guests: guestsList,
        startTime: start,
        endTime: end,
        startYear,
        startMonth,
        startDate,
        startHour,
        startMin,
        durationMinutes,
        startTimeStr: formatTime(start),
        endTimeStr: formatTime(end),
        dateStr: `${startYear}-${(startMonth + 1).toString().padStart(2, "0")}-${startDate.toString().padStart(2, "0")}`,
        isDbRecord: true,
      };
    });
  }, [appointments]);

  // Navegación
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 22));
  };

  // Abrir Modal de Creación en una hora específica
  const openCreateModal = (dateStr: string, startH: number) => {
    setModalDate(dateStr);
    const startStr = `${startH.toString().padStart(2, "0")}:00`;
    const endStr = `${Math.min(23, startH + 1).toString().padStart(2, "0")}:00`;
    setModalStartTime(startStr);
    setModalEndTime(endStr);
    setModalTitle("");
    setModalLocation("");
    setModalDescription("");
    setModalActiveTab("details");
    setModalOpen(true);
  };

  // Agregar invitado a la lista
  const handleAddGuest = () => {
    if (!guestInput.trim()) return;
    if (!guests.includes(guestInput.trim())) {
      setGuests([...guests, guestInput.trim()]);
    }
    setGuestInput("");
  };

  const handleRemoveGuest = (guestToRemove: string) => {
    setGuests(guests.filter((g) => g !== guestToRemove));
  };

  // Copiar enlace de Google Meet
  const handleCopyMeetLink = () => {
    const link = "https://meet.google.com/abc-defg-hij";
    navigator.clipboard.writeText(link);
    setMeetLinkCopied(true);
    setTimeout(() => setMeetLinkCopied(false), 2000);
  };

  // Formateadores de barra de herramientas en descripción
  const handleFormatText = (prefix: string, suffix: string = "") => {
    setModalDescription((prev) => `${prev}${prefix}texto${suffix}`);
  };

  // Guardar nuevo evento en SQLite
  const handleSaveEvent = async () => {
    const finalTitle = modalTitle.trim() || "Reunión comercial";

    const startDateTime = new Date(`${modalDate}T${isAllDay ? "00:00" : modalStartTime}:00`);
    const endDateTime = new Date(`${modalDate}T${isAllDay ? "23:59" : modalEndTime}:00`);

    const fullNotes = [
      `Título: ${finalTitle}`,
      modalDescription ? modalDescription : "",
      modalLocation ? `Ubicación: ${modalLocation}` : "",
      modalHasMeet ? "Google Meet: https://meet.google.com/abc-defg-hij" : "",
      guests.length > 0 ? `Invitados: ${guests.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: finalTitle,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: fullNotes,
          guests: guests,
          contactName: guests[0] || "Invitado Comercial",
          contactEmail: guests[0]?.includes("@") ? guests[0] : null,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setModalTitle("");
        setModalDescription("");
        setModalLocation("");
        showToast("✓ Evento guardado con éxito en tu base de datos");
        fetchAppointments();
      } else {
        alert("Error al guardar la cita en la base de datos.");
      }
    } catch (err) {
      alert("Error de conexión al guardar el evento.");
    }
  };

  // Eliminar evento
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este evento?")) return;

    try {
      const res = await fetch(`/api/calendar/events?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInspectModalOpen(false);
        showToast("✓ Evento eliminado correctamente");
        fetchAppointments();
      }
    } catch (err) {
      alert("Error al eliminar el evento.");
    }
  };

  // Formateadores de fecha
  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  const formattedHeaderDate = useMemo(() => {
    const d = currentDate.getDate();
    const m = monthNames[currentDate.getMonth()];
    const y = currentDate.getFullYear();
    if (viewMode === "day") {
      return `${d} ${m} ${y}`;
    }
    return `${m.charAt(0).toUpperCase() + m.slice(1)} ${y}`;
  }, [currentDate, viewMode]);

  // Horas del día (01:00 a 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Días de la semana para vista Semana
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Franjas horarias sugeridas para la pestaña "Ver horarios disponibles"
  const availableSlotsList = [
    { start: "09:00", end: "09:45", label: "09:00 - 09:45 (Recomendado)" },
    { start: "10:00", end: "10:45", label: "10:00 - 10:45" },
    { start: "12:00", end: "12:45", label: "12:00 - 12:45" },
    { start: "15:00", end: "15:45", label: "15:00 - 15:45" },
    { start: "16:00", end: "16:45", label: "16:00 - 16:45" },
    { start: "17:00", end: "17:45", label: "17:00 - 17:45" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white text-slate-800 select-none overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER SUPERIOR ESTILO GOOGLE CALENDAR (IMÁGENES 1, 2, 3) */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          {/* Botón Hamburguesa */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Alternar barra lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Azul Calendario */}
          <div className="flex items-center gap-2 mr-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] uppercase font-semibold leading-none -mt-0.5">OCT</span>
              <span className="text-base font-extrabold leading-none">22</span>
            </div>
            <span className="text-xl font-medium text-slate-700 tracking-tight">Calendario</span>
          </div>

          {/* Botón Hoy */}
          <button
            onClick={handleToday}
            className="px-4 py-2 border border-slate-300 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hoy
          </button>

          {/* Flechas Navegación */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Título de Fecha Activa */}
          <span className="text-xl font-semibold text-slate-700 capitalize ml-2">
            {formattedHeaderDate}
          </span>
        </div>

        {/* Acciones del Lado Derecho */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Ayuda">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600" title="Configuración">
            <Settings className="w-5 h-5" />
          </button>

          {/* Selector de Vista (Día / Semana / Mes) */}
          <div className="relative ml-1">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="appearance-none bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2 pr-8 rounded-lg text-sm font-semibold text-slate-700 cursor-pointer shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>

          {/* Switcher Calendario / Tareas */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden ml-2 shadow-sm">
            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-r border-slate-300">
              <Check className="w-4 h-4" />
            </button>
            <button className="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-50">
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar de Usuario */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow ml-2">
            ID
          </div>
        </div>
      </div>

      {/* 2. CUERPO: SIDEBAR + GRID PRINCIPAL + DOCK DERECHO */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR IZQUIERDO (COLAPSIBLE) */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col gap-6 overflow-y-auto shrink-0 select-none">
            {/* Botón "+ Crear" Google Style */}
            <div>
              <button
                onClick={() => openCreateModal(currentDateStr, 13)}
                className="flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg hover:bg-slate-50 transition-all font-semibold text-sm text-slate-800"
              >
                <div className="w-6 h-6 flex items-center justify-center text-blue-600">
                  <Plus className="w-6 h-6 stroke-[3]" />
                </div>
                <span>Crear</span>
              </button>
            </div>

            {/* Mini Calendario Interactivo */}
            <div className="bg-white">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3 px-1">
                <span>Octubre 2026</span>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-full">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-full">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Días de la semana mini */}
              <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 mb-1">
                <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
              </div>

              {/* Matriz de fechas mini */}
              <div className="grid grid-cols-7 text-center text-xs text-slate-700 gap-y-1">
                <span className="text-slate-400">28</span>
                <span className="text-slate-400">29</span>
                <span className="text-slate-400">30</span>
                <span>1</span><span>2</span><span>3</span><span>4</span>
                <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span>
                <span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span>
                <span>19</span><span>20</span><span>21</span>
                {/* 22 marcado en azul */}
                <button
                  onClick={handleToday}
                  className="bg-blue-600 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                >
                  22
                </button>
                <span>23</span><span>24</span><span>25</span>
                <span>26</span><span>27</span><span>28</span><span>29</span><span>30</span><span>31</span>
                <span className="text-slate-400">1</span>
              </div>
            </div>

            {/* Buscar Personas */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar personas"
                className="w-full pl-9 pr-3 py-2 bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-xs rounded-full border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Páginas de Reservas */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
              <span>Páginas de reservas</span>
              <button
                onClick={() => openCreateModal(currentDateStr, 10)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Mis Calendarios */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
                <span>Mis calendarios</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-500" />
              </div>

              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calIsmael}
                    onChange={(e) => setCalIsmael(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">Ismael Doy</span>
                </label>

                <label className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calCumpleanos}
                    onChange={(e) => setCalCumpleanos(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-medium">Cumpleaños</span>
                </label>

                <label className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calTasks}
                    onChange={(e) => setCalTasks(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-slate-700 font-medium">Tasks</span>
                </label>
              </div>
            </div>

            {/* Otros Calendarios */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 px-1">
                <span>Otros calendarios</span>
                <div className="flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
                  <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calFestivos}
                    onChange={(e) => setCalFestivos(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-slate-700 font-medium">Festivos en Estados Unidos</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 text-[11px] text-slate-400 border-t border-slate-100">
              <span>Condiciones &middot; Privacidad</span>
            </div>
          </aside>
        )}

        {/* ÁREA CENTRAL: VISTAS DEL CALENDARIO */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-white relative">
          {/* ========================================================= */}
          {/* VISTA 1: DÍA (TEMPLATE IMAGEN 1)                          */}
          {/* ========================================================= */}
          {viewMode === "day" && (
            <div className="flex flex-col min-w-[600px] pb-12">
              {/* Cabecera del Día */}
              <div className="sticky top-0 bg-white border-b border-slate-200 z-10 pl-16 pr-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-600 uppercase">JUE</span>
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl shadow-sm">
                      22
                    </span>
                  </div>

                  {/* Tareas Pendientes Chip */}
                  <div className="ml-4 flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-full shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>7 tareas pendientes</span>
                  </div>
                </div>

                <span className="text-xs font-mono text-slate-400">GMT-04 (Caracas / Madrid)</span>
              </div>

              {/* Rejilla de Horas */}
              <div className="relative">
                {/* Línea Roja de Tiempo Actual (07:15 aprox como en imagen) */}
                <div
                  className="absolute left-16 right-0 border-t-2 border-red-500 z-10 flex items-center pointer-events-none"
                  style={{ top: "435px" }}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-xs"></span>
                </div>

                {hours.map((h) => {
                  const hourLabel = `${h.toString().padStart(2, "0")}:00`;
                  return (
                    <div
                      key={h}
                      onClick={() => openCreateModal(currentDateStr, h)}
                      className="flex h-14 border-b border-slate-100 hover:bg-slate-50/70 transition-colors group cursor-pointer relative"
                    >
                      {/* Etiqueta de Hora Izquierda */}
                      <div className="w-16 pr-3 text-right text-[11px] font-semibold text-slate-400 -mt-2.5">
                        {h > 0 ? hourLabel : ""}
                      </div>

                      {/* Espacio de Eventos */}
                      <div className="flex-1 relative border-l border-slate-100">
                        {/* Evento 08:00 - Reunión con Juan Andrés de Matrix (Imagen 1) */}
                        {h === 8 && calIsmael && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInspectEvent(defaultEvents[0]);
                              setInspectModalOpen(true);
                            }}
                            className="absolute top-0 left-2 right-4 h-[75px] bg-blue-600 text-white rounded-lg p-2 text-xs shadow-md z-10 flex flex-col justify-between hover:bg-blue-700 transition-colors"
                          >
                            <span className="font-bold leading-tight truncate">
                              Reunión con Juan Andrés de Matrix
                            </span>
                            <span className="text-[11px] opacity-90 truncate">
                              08:00, Planta baja de Los Palos Grandes
                            </span>
                          </div>
                        )}

                        {/* Evento 11:00 - Reunión con Luis Pérez (Imagen 1) */}
                        {h === 11 && calIsmael && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInspectEvent(defaultEvents[1]);
                              setInspectModalOpen(true);
                            }}
                            className="absolute top-0 left-2 right-4 h-[50px] bg-blue-600 text-white rounded-lg p-2 text-xs shadow-md z-10 flex flex-col justify-between hover:bg-blue-700 transition-colors"
                          >
                            <span className="font-bold leading-tight truncate">
                              Reunión con Luis Pérez
                            </span>
                            <span className="text-[11px] opacity-90 truncate">
                              11:00, Lex, El Rosal
                            </span>
                          </div>
                        )}

                        {/* Citas Reales Traídas de la Base de Datos SQLite */}
                        {parsedAppointments
                          .filter((apt) => {
                            const isSameDay =
                              apt.startYear === currentDate.getFullYear() &&
                              apt.startMonth === currentDate.getMonth() &&
                              apt.startDate === currentDate.getDate();
                            return isSameDay && apt.startHour === h && calIsmael;
                          })
                          .map((apt, aptIdx, arr) => {
                            const topOffset = Math.round((apt.startMin / 60) * 56);
                            const heightPx = Math.max(
                              44,
                              Math.min(Math.round((apt.durationMinutes / 60) * 56) - 4, 160)
                            );

                            return (
                              <div
                                key={apt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(apt);
                                  setInspectModalOpen(true);
                                daylight: true;
                                }}
                                style={{
                                  top: `${topOffset}px`,
                                  height: `${heightPx}px`,
                                  left: arr.length > 1 && aptIdx > 0 ? "50%" : "8px",
                                  right: arr.length > 1 && aptIdx === 0 ? "52%" : "16px",
                                }}
                                className="absolute bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 text-xs shadow-md z-20 flex flex-col justify-between transition-colors cursor-pointer border border-blue-500/80"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold leading-tight truncate">
                                    {apt.title}
                                  </span>
                                  {apt.meetLink && (
                                    <Video className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-[11px] opacity-90 truncate">
                                  <span>{apt.startTimeStr} - {apt.endTimeStr}</span>
                                  {apt.guests.length > 0 && (
                                    <span className="text-[10px] bg-blue-500/80 px-1.5 py-0.5 rounded text-white shrink-0">
                                      {apt.guests.length} {apt.guests.length === 1 ? "inv." : "invs."}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 2: SEMANA (TEMPLATE IMAGEN 2)                       */}
          {/* ========================================================= */}
          {viewMode === "week" && (
            <div className="flex flex-col min-w-[800px] pb-12">
              {/* Cabecera de los 7 Días */}
              <div className="sticky top-0 bg-white border-b border-slate-200 z-10 flex pl-16 pr-2 py-2">
                {weekDays.map((d, idx) => {
                  const isToday = d.getDate() === 22;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <span className={`text-[11px] font-bold ${isToday ? "text-blue-600" : "text-slate-500"}`}>
                        {dayNames[d.getDay()]}
                      </span>
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold ${
                          isToday ? "bg-blue-600 text-white shadow-sm" : "text-slate-800"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Rejilla de Horas de Semana */}
              <div className="relative">
                {hours.map((h) => (
                  <div key={h} className="flex h-12 border-b border-slate-100 group">
                    <div className="w-16 pr-3 text-right text-[11px] font-semibold text-slate-400 -mt-2">
                      {h > 0 ? `${h.toString().padStart(2, "0")}:00` : ""}
                    </div>

                    <div className="flex-1 grid grid-cols-7 border-l border-slate-100">
                      {weekDays.map((d, colIdx) => {
                        const isThursday = d.getDate() === 22;
                        const cellDayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
                        return (
                          <div
                            key={colIdx}
                            onClick={() => openCreateModal(cellDayStr, h)}
                            className="border-r border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer relative p-0.5"
                          >
                            {/* Evento 08:00 del Jueves 22 */}
                            {isThursday && h === 8 && calIsmael && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(defaultEvents[0]);
                                  setInspectModalOpen(true);
                                }}
                                className="absolute inset-x-1 top-0 h-[65px] bg-blue-600 text-white rounded p-1 text-[11px] font-semibold leading-tight shadow-sm z-10 truncate"
                              >
                                Reunión con Juan...
                              </div>
                            )}

                            {/* Evento 11:00 del Jueves 22 */}
                            {isThursday && h === 11 && calIsmael && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(defaultEvents[1]);
                                  setInspectModalOpen(true);
                                }}
                                className="absolute inset-x-1 top-0 h-[45px] bg-blue-600 text-white rounded p-1 text-[11px] font-semibold leading-tight shadow-sm z-10 truncate"
                              >
                                Reunión con Luis...
                              </div>
                            )}

                            {/* Citas Reales de SQLite en Vista Semana */}
                            {calIsmael &&
                              parsedAppointments
                                .filter((apt) => {
                                  const isSameDay =
                                    apt.startYear === d.getFullYear() &&
                                    apt.startMonth === d.getMonth() &&
                                    apt.startDate === d.getDate();
                                  return isSameDay && apt.startHour === h;
                                })
                                .map((apt) => (
                                  <div
                                    key={apt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveInspectEvent(apt);
                                      setInspectModalOpen(true);
                                    }}
                                    className="absolute inset-x-1 top-0 h-[45px] bg-blue-600 hover:bg-blue-700 text-white rounded p-1 text-[11px] font-semibold leading-tight shadow-sm z-20 truncate flex flex-col justify-between cursor-pointer"
                                  >
                                    <span className="truncate">{apt.title}</span>
                                    <span className="text-[9px] opacity-90">{apt.startTimeStr} - {apt.endTimeStr}</span>
                                  </div>
                                ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA 3: MES (TEMPLATE IMAGEN 3)                          */}
          {/* ========================================================= */}
          {viewMode === "month" && (
            <div className="flex flex-col flex-1 pb-4">
              {/* Cabecera Días del Mes */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-500 bg-slate-50">
                <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span><span>SÁB</span><span>DOM</span>
              </div>

              {/* Matriz de Días (Octubre 2026) */}
              <div className="grid grid-cols-7 grid-rows-5 flex-1 border-collapse">
                {Array.from({ length: 35 }, (_, idx) => {
                  const dayNum = idx - 2;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= 31;
                  const displayDay = dayNum < 1 ? 27 + idx : dayNum > 31 ? dayNum - 31 : dayNum;
                  const isToday = isCurrentMonth && dayNum === 22;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isCurrentMonth) {
                          openCreateModal(`2026-10-${dayNum.toString().padStart(2, "0")}`, 10);
                        }
                      }}
                      className={`min-h-[110px] border-r border-b border-slate-200 p-1.5 flex flex-col justify-between hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        !isCurrentMonth ? "bg-slate-50/50 text-slate-400" : "bg-white text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday ? "bg-blue-600 text-white shadow-xs" : ""
                          }`}
                        >
                          {displayDay}
                        </span>
                      </div>

                      {/* Event Chips dentro de las casillas */}
                      <div className="space-y-1 mt-1 overflow-hidden">
                        {isCurrentMonth && dayNum === 1 && calTasks && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInspectEvent(defaultEvents[2]);
                              setInspectModalOpen(true);
                            }}
                            className="text-[10px] font-semibold text-slate-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded truncate"
                          >
                            ○ 11:30 Seguimiento
                          </div>
                        )}

                        {isCurrentMonth && dayNum === 12 && calFestivos && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInspectEvent(defaultEvents[3]);
                              setInspectModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-white bg-teal-600 px-1.5 py-0.5 rounded truncate"
                          >
                            Día de la Raza
                          </div>
                        )}

                        {isCurrentMonth && dayNum === 22 && (
                          <>
                            {calTasks && (
                              <div className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded truncate flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>7 tareas pendie...</span>
                              </div>
                            )}
                            {calIsmael && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(defaultEvents[0]);
                                  setInspectModalOpen(true);
                                }}
                                className="text-[10px] font-semibold text-white bg-blue-600 px-1.5 py-0.5 rounded truncate"
                              >
                                ● 08:00 Reunión con...
                              </div>
                            )}
                            {calIsmael && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(defaultEvents[1]);
                                  setInspectModalOpen(true);
                                }}
                                className="text-[10px] font-semibold text-white bg-blue-600 px-1.5 py-0.5 rounded truncate"
                              >
                                ● 11:00 Reunión con...
                              </div>
                            )}
                          </>
                        )}

                        {/* Citas Reales de SQLite en Vista Mes */}
                        {isCurrentMonth &&
                          calIsmael &&
                          parsedAppointments
                            .filter((apt) => {
                              return (
                                apt.startYear === 2026 &&
                                apt.startMonth === 9 &&
                                apt.startDate === dayNum
                              );
                            })
                            .map((apt) => (
                              <div
                                key={apt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInspectEvent(apt);
                                  setInspectModalOpen(true);
                                }}
                                className="text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-1.5 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
                                <span className="truncate">{apt.startTimeStr} {apt.title}</span>
                              </div>
                            ))}

                        {isCurrentMonth && dayNum === 31 && calFestivos && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInspectEvent(defaultEvents[4]);
                              setInspectModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-white bg-teal-700 px-1.5 py-0.5 rounded truncate"
                          >
                            Halloween
                          </div>
                        )}
                      </div>

                      <div className="h-1"></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* 3. DOCK DERECHO DE ICONOS (ESTILO GOOGLE KEEP, TASKS, MAPS) */}
        <div className="w-14 border-l border-slate-200 bg-white flex flex-col items-center py-4 gap-6 shrink-0 z-10">
          <button title="Google Keep" className="p-2 hover:bg-slate-100 rounded-full text-amber-500">
            <Lightbulb className="w-5 h-5" />
          </button>
          <button title="Google Tasks" className="p-2 hover:bg-slate-100 rounded-full text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </button>
          <button title="Contactos" className="p-2 hover:bg-slate-100 rounded-full text-blue-500">
            <User className="w-5 h-5" />
          </button>
          <button title="Google Maps" className="p-2 hover:bg-slate-100 rounded-full text-emerald-600">
            <MapPin className="w-5 h-5" />
          </button>
          <div className="w-6 h-px bg-slate-200 my-1"></div>
          <button title="Obtener complementos" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL CREAR EVENTO COMPLETO (TEMPLATE IMAGEN 4)         */}
      {/* ========================================================= */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Cabecera del Modal */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Agregar título"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="text-2xl font-medium text-slate-800 placeholder-slate-400 border-b-2 border-transparent focus:border-blue-600 outline-none w-full pb-1 transition-colors"
                  autoFocus
                />
              </div>

              {/* Botón Guardar Google Blue */}
              <button
                type="button"
                onClick={handleSaveEvent}
                className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
              >
                Guardar
              </button>
            </div>

            {/* Fila de Fecha y Horas */}
            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-md font-semibold text-slate-800"
              />

              {!isAllDay && (
                <>
                  <input
                    type="time"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-md text-slate-800 font-medium"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="bg-white border border-slate-300 px-2.5 py-1.5 rounded-md text-slate-800 font-medium"
                  />
                </>
              )}

              <span className="text-blue-600 hover:underline cursor-pointer ml-1" title="Zona: GMT-04 (Caracas / Madrid)">
                Zona horaria
              </span>

              <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Todo el día</span>
              </label>

              <select
                value={repeatOption}
                onChange={(e) => setRepeatOption(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 ml-2"
              >
                <option value="no_repeat">No se repite</option>
                <option value="daily">Todos los días</option>
                <option value="weekly">Cada semana el jueves</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            {/* Pestañas: Detalles del evento / Ver horarios disponibles */}
            <div className="flex border-b border-slate-200 px-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalActiveTab("details")}
                className={`py-2.5 mr-6 border-b-2 transition-colors ${
                  modalActiveTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Detalles del evento
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab("slots")}
                className={`py-2.5 border-b-2 transition-colors ${
                  modalActiveTab === "slots"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Ver horarios disponibles
              </button>
            </div>

            {/* Contenido según pestaña */}
            {modalActiveTab === "slots" ? (
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Horarios Libres Calculados para {modalDate}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableSlotsList.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setModalStartTime(slot.start);
                        setModalEndTime(slot.end);
                        setModalActiveTab("details");
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left transition-all group"
                    >
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 block">
                        {slot.label}
                      </span>
                      <span className="text-[11px] text-slate-500">Duración: 45 min · Sin colisión</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Pestaña: Detalles del Evento */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[50vh]">
                {/* Columna Izquierda: Datos del Evento (2 cols) */}
                <div className="md:col-span-2 space-y-4">
                  {/* Botón Videoconferencia Google Meet */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setModalHasMeet(!modalHasMeet)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        modalHasMeet
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Video className="w-4 h-4 text-blue-600" />
                        <span>
                          {modalHasMeet
                            ? "Videoconferencia de Google Meet activada"
                            : "Agregar una videoconferencia de Google Meet"}
                        </span>
                      </div>
                      {modalHasMeet && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyMeetLink();
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{meetLinkCopied ? "¡Copiado!" : "Copiar enlace"}</span>
                        </button>
                      )}
                    </button>
                    {modalHasMeet && (
                      <span className="text-[11px] text-slate-400 font-mono block pl-2">
                        meet.google.com/abc-defg-hij
                      </span>
                    )}
                  </div>

                  {/* Ubicación */}
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Agregar ubicación (ej: Lex, El Rosal o Presencial)"
                      value={modalLocation}
                      onChange={(e) => setModalLocation(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 rounded-lg text-xs border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Notificaciones */}
                  <div className="space-y-2">
                    {notifications.map((notif, nIdx) => (
                      <div key={notif.id} className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                            {notif.type === "email" ? "Correo electrónico" : "Notificación"} · {notif.minutes} minutos
                          </span>
                        </div>
                        {notifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNotifications(notifications.filter((n) => n.id !== notif.id))}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications([
                          ...notifications,
                          { id: Date.now().toString(), type: "popup", minutes: 30 },
                        ])
                      }
                      className="text-blue-600 hover:underline cursor-pointer text-xs font-semibold pl-6 block"
                    >
                      + Agregar notificación
                    </button>
                  </div>

                  {/* Calendario Propietario y Opciones */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-600"></div>
                      <select
                        value={selectedCalendarColor}
                        onChange={(e) => setSelectedCalendarColor(e.target.value)}
                        className="font-semibold text-slate-800 bg-transparent border-none cursor-pointer outline-none"
                      >
                        <option value="blue">Ismael Doy (Principal)</option>
                        <option value="green">Citas Comerciales</option>
                        <option value="amber">Tareas</option>
                      </select>
                    </div>

                    <span className="text-slate-300">|</span>

                    <select
                      value={availabilityStatus}
                      onChange={(e) => setAvailabilityStatus(e.target.value)}
                      className="text-slate-600 bg-transparent border-none cursor-pointer outline-none"
                    >
                      <option value="busy">Ocupado</option>
                      <option value="free">Disponible</option>
                    </select>

                    <span className="text-slate-300">|</span>

                    <select
                      value={visibilityOption}
                      onChange={(e) => setVisibilityOption(e.target.value)}
                      className="text-slate-600 bg-transparent border-none cursor-pointer outline-none"
                    >
                      <option value="default">Visibilidad predeterminada</option>
                      <option value="public">Pública</option>
                      <option value="private">Privada</option>
                    </select>
                  </div>

                  {/* Toolbar de Formato */}
                  <div className="flex items-center gap-2 border border-slate-200 rounded-t-lg bg-slate-50 px-3 py-1.5 text-slate-600 text-xs">
                    <button
                      type="button"
                      onClick={() => handleFormatText("**", "**")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Negrita"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText("*", "*")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Cursiva"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText("<u>", "</u>")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Subrayado"
                    >
                      <UnderlineIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-300"></div>
                    <button
                      type="button"
                      onClick={() => handleFormatText("\n• ")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Lista de viñetas"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText("\n1. ")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Lista numerada"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormatText("[Enlace](https://...)")}
                      className="p-1 hover:bg-slate-200 rounded"
                      title="Insertar enlace"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Descripción */}
                  <textarea
                    placeholder="Agregar descripción o notas de la reunión..."
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    rows={3}
                    className="w-full -mt-2 p-3 bg-white rounded-b-lg border border-slate-200 border-t-0 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Columna Derecha: Invitados (1 col) */}
                <div className="space-y-4 border-l border-slate-100 pl-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Invitados</span>

                    {/* Input y botón agregar */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nombre o correo..."
                        value={guestInput}
                        onChange={(e) => setGuestInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddGuest();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs border border-slate-200 focus:bg-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddGuest}
                        className="px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>

                    {/* Chips de Invitados agregados */}
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {guests.map((g, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-100 px-2 py-1 rounded-md text-[11px] text-slate-700"
                        >
                          <span className="truncate max-w-[130px] font-medium">{g}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGuest(g)}
                            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Permisos */}
                  <div className="pt-2 text-xs space-y-2 text-slate-600 border-t border-slate-100">
                    <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Permisos de los invitados
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permModify}
                        onChange={(e) => setPermModify(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Modificar el evento</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permInviteOthers}
                        onChange={(e) => setPermInviteOthers(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Invitar a otras personas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permSeeGuestList}
                        onChange={(e) => setPermSeeGuestList(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Ver la lista de invitados</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL DE INSPECCIÓN / DETALLE DE EVENTO EXISTENTE       */}
      {/* ========================================================= */}
      {inspectModalOpen && activeInspectEvent && (
        <div
          onClick={() => setInspectModalOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            {/* Header del evento */}
            <div className="bg-blue-600 p-6 text-white flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider opacity-80 block mb-1">
                  Evento Confirmado
                </span>
                <h3 className="text-xl font-bold leading-tight">{activeInspectEvent.title}</h3>
                <span className="text-xs opacity-90 block mt-1">
                  📅 {activeInspectEvent.dateStr} &middot; {activeInspectEvent.startTimeStr} - {activeInspectEvent.endTimeStr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la cita */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              {/* Google Meet Button */}
              {activeInspectEvent.meetLink && (
                <a
                  href={activeInspectEvent.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Unirme con Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              )}

              {/* Descarga de Invitación Formal (.ics) para participantes */}
              {activeInspectEvent.isDbRecord && (
                <a
                  href={`/api/calendar/invite?appointmentId=${activeInspectEvent.id}`}
                  download
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <span>Descargar Invitación Oficial (.ics para Gmail / Outlook)</span>
                </a>
              )}

              {/* Ubicación */}
              {activeInspectEvent.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{activeInspectEvent.location}</span>
                </div>
              )}

              {/* Invitados */}
              {activeInspectEvent.guests && activeInspectEvent.guests.length > 0 && (
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Invitados:</span>
                    <span className="text-slate-600">{activeInspectEvent.guests.join(", ")}</span>
                  </div>
                </div>
              )}

              {/* Notas */}
              {activeInspectEvent.description && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 whitespace-pre-wrap">
                  {activeInspectEvent.description}
                </div>
              )}

              {/* Acciones del pie */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeInspectEvent.isDbRecord ? "Almacenado en SQLite dev.db" : "Evento de demostración"}
                </span>

                {activeInspectEvent.isDbRecord && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(activeInspectEvent.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
