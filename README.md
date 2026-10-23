# 📅 IDS Calendario — Sistema Autónomo de Agendamiento (Paridad Google Calendar)

Plataforma independiente, 100% de código abierto y auto-alojada (*self-hosted*), diseñada con paridad visual a **Google Calendar** e integrada con motor de detección de colisiones, generación estándar de invitaciones **RFC 5545 iCalendar (`.ics`)** y despacho automático de notificaciones por correo electrónico.

---

## 🏛️ Estructura del Proyecto

```
IDS_CALENDARIO/
├── .env                       # Variables de entorno y credenciales SMTP / Resend
├── .env.example               # Plantilla de variables de entorno
├── README.md                  # Documentación oficial de uso e instalación
├── package.json               # Dependencias del proyecto (Next.js, Tailwind, Prisma)
├── tsconfig.json              # Configuración TypeScript estricta
├── tailwind.config.ts         # Sistema de diseño y tokens de Tailwind
├── postcss.config.mjs         # Procesador CSS
├── next.config.mjs            # Configuración de compilación Next.js
├── prisma/
│   ├── schema.prisma          # Esquema relacional (Calendar, Appointment, Contact)
│   └── dev.db                 # Base de datos SQLite local pre-configurada
└── src/
    ├── app/
    │   ├── layout.tsx         # Layout general con cabecera de IDS Calendario
    │   ├── page.tsx           # Vista directa del Calendario en ruta raíz (/)
    │   ├── calendar/
    │   │   └── page.tsx       # Cuadrícula interactiva Día / Semana / Mes (Google Style)
    │   ├── globals.css        # Estilos globales y directivas Tailwind
    │   └── api/
    │       ├── calendar/
    │       │   ├── events/    # CRUD de citas (GET, POST, DELETE)
    │       │   └── invite/    # Endpoint de descarga de archivos oficiales .ics
    │       └── email/
    │           └── test/      # Consola visual para probar envío de correos
    └── lib/
        ├── db.ts              # Cliente Singleton de Prisma
        ├── calendar/
        │   ├── ics.ts         # Generador nativo RFC 5545 iCalendar (Gmail/Apple/Outlook)
        │   └── slots.ts       # Motor de cálculo de huecos libres y buffers de descanso
        ├── email/
        │   └── sender.ts      # Motor de correos (Resend API, Gmail SMTP o Simulación)
        └── workflows/
            └── dispatcher.ts  # Despachador reactivo de eventos al agendar citas
```

---

## ⚡ Cómo Ejecutar la Aplicación

### 1. Iniciar el Servidor de Desarrollo
Abre tu terminal y ejecuta:

```bash
cd /Users/ismaeldoy/Desktop/IDS_CALENDARIO
export PATH="/Users/ismaeldoy/node22/bin:$PATH"
npm run dev
```

La aplicación se iniciará automáticamente en el **puerto 3001** para no interferir con otros servicios locales:
👉 **[http://localhost:3001](http://localhost:3001)**

---

## 🌐 Rutas y Funcionalidades Disponibles

| Ruta | Descripción |
| :--- | :--- |
| **`http://localhost:3001/`** | Calendario interactivo con vistas de Día, Semana y Mes, mini-calendario lateral y creación de citas. |
| **`http://localhost:3001/calendar`** | Acceso canónico al módulo de calendario. |
| **`http://localhost:3001/api/calendar/events`** | API REST JSON para listar, crear o eliminar citas en SQLite. |
| **`http://localhost:3001/api/calendar/invite?appointmentId=[ID]`** | Descarga instantánea de la invitación `.ics` para importar a Google Calendar o Outlook. |
| **`http://localhost:3001/api/email/test?to=tu-correo@gmail.com`** | Prueba visual interactiva del motor de envío de correos. |

---

## 📬 Configuración del Envío de Correos Reales

Por defecto, el sistema opera en **Modo Simulación**, registrando las invitaciones y adjuntos `.ics` en los logs locales para evitar envíos no deseados durante el desarrollo.

Para recibir correos reales en bandejas de entrada externas, edita el archivo `.env`:

### Opción A: Resend API (Recomendada — 3.000 correos/mes gratis)
1. Obtén tu clave gratuita en [https://resend.com](https://resend.com).
2. Colócala en `.env`:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxx"
   EMAIL_FROM="IDS Calendario <onboarding@resend.dev>"
   ```

### Opción B: Tu Cuenta de Gmail por SMTP Directo (500 correos/día gratis)
1. Entra a tu cuenta Google: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Genera una *"Contraseña de aplicación"* de 16 caracteres.
3. Colócala en `.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER="tu-correo@gmail.com"
   SMTP_PASS="xxxx xxxx xxxx xxxx"
   ```

---

## 🗄️ Base de Datos e Inspección Visual

Para abrir la interfaz visual de base de datos de Prisma Studio:
```bash
cd /Users/ismaeldoy/Desktop/IDS_CALENDARIO
export PATH="/Users/ismaeldoy/node22/bin:$PATH"
npm run db:studio
```
Se abrirá en **`http://localhost:5556`**, permitiéndote ver, editar y filtrar todas las citas (`Appointment`) y calendarios (`Calendar`) almacenados en SQLite.
