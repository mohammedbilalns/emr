# EMR Frontend Application (`apps/client`)

> Modern Single Page Application (SPA) for the Enterprise Electronic Medical Record (EMR) Appointment Management System, built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

---

## 1. Overview & Architecture

The frontend application provides role-tailored clinical user interfaces for **Super Admins**, **Receptionists**, and **Physicians**. It communicates with the Express backend via REST API endpoints and receives live real-time schedule events through a WebSocket gateway.

### Core Architectural Decisions:
- **Server State vs Client State Separation**:
  - **Server State**: Managed strictly via **TanStack Query (React Query)** with automatic caching, request deduplication, background re-fetching, and micro-refetches triggered by WebSocket events.
  - **Client / Session State**: Managed via a lightweight **`AuthContext`** that stores the authenticated user profile and coordinate token refresh cycles.
  - **Form State**: Managed via **React Hook Form** with schemas imported directly from the shared contract library (`@emr/shared`) through `@hookform/resolvers/zod`.
- **Single-Flight Token Refresh Interceptor**:
  - The Axios HTTP client (`shared/api/axios-client.ts`) intercepts `401 Unauthorized` responses.
  - It buffers concurrent in-flight requests into a retry queue and initiates exactly **one** call to `POST /api/v1/auth/refresh`.
  - Upon receiving a fresh access token, it updates the in-memory authorization header and replays all queued requests seamlessly without logging the user out or flashing error banners.
- **Granular Real-Time Invalidation**:
  - Instead of manually manipulating complex client state upon receiving WebSocket messages, the custom `useRealtimeScheduler` hook invalidates targeted TanStack Query cache keys (`['slots', doctorId, date]`), triggering an immediate surgical refetch.

---

## 2. Directory Structure

```
apps/client/src/
├── features/                        # Domain feature modules
│   ├── appointments/                # Appointment management
│   │   ├── api/                     # TanStack Query hooks (useAppointments, useCancelAppointment)
│   │   ├── components/              # AppointmentTable, StatusBadge, NotesModal, CancelDialog
│   │   └── pages/                   # AppointmentsPage
│   ├── auth/                        # Authentication & session
│   │   ├── api/                     # Login & logout mutation hooks
│   │   ├── components/              # LoginForm, RoleGate
│   │   └── pages/                   # LoginPage
│   ├── dashboard/                   # Role-specific clinical dashboards
│   │   ├── components/              # MetricCards, QuickActions, TodaysAppointments
│   │   └── pages/                   # DashboardPage
│   ├── doctors/                     # Doctor & schedule management
│   │   ├── api/                     # Doctor query and mutation hooks
│   │   ├── components/              # DoctorCard, CreateDoctorModal, ScheduleEditor
│   │   └── pages/                   # DoctorsPage
│   ├── scheduler/                   # Interactive slot scheduler
│   │   ├── api/                     # Slot fetching queries and booking mutations
│   │   ├── components/              # CalendarPicker, DoctorFilter, SlotGrid, BookingModal
│   │   └── pages/                   # SchedulerPage
│   └── staff/                       # Receptionist management
│       ├── api/                     # Receptionist listing and creation hooks
│       ├── components/              # StaffTable, CreateReceptionistModal
│       └── pages/                   # StaffPage
│
├── shared/                          # Cross-cutting UI and utilities
│   ├── api/                         # Axios client, token manager, error formatters
│   ├── components/                  # Button, Input, Modal, Badge, Spinner, Layout
│   ├── context/                     # AuthContext & Session Provider
│   ├── hooks/                       # useDebounce, useToast
│   └── socket/                      # Socket.IO client instance and useRealtime hook
│
├── routes/                          # Route definitions with ProtectedRoute & RoleGuard
│   └── AppRoutes.tsx
├── App.tsx                          # Root application wrapper with QueryClientProvider
├── index.css                        # Tailwind CSS imports & global styles
└── main.tsx                         # React DOM mount point
```

---

## 3. Key Feature Modules

### 3.1 Scheduler & Slot Grid (`features/scheduler`)
- **Doctor & Department Filtering**: Instant dynamic filtering of available doctors based on selected medical department.
- **Date Picker Navigation**: Prevents selection of past dates and highlights today's schedule.
- **Slot Grid**: Visualizes available vs booked consultation slots. Implements `React.memo` on slot cards to prevent unnecessary re-renders when parent states change.
- **Dual Patient Intake Modal**:
  - **Existing Patient**: Debounced autocomplete search against `GET /api/v1/patients/search` by patient ID (`P000001`), mobile phone, or name.
  - **New Patient**: Atomic registration form (name, mobile, gender, date of birth) that submits directly to `POST /api/v1/appointments` inside a transactional backend workflow.

### 3.2 Appointment Directory (`features/appointments`)
- **Server-Side Filtering**: Filter by doctor, department, appointment status (`SCHEDULED`, `ARRIVED`, `COMPLETED`, `CANCELLED`), patient mobile prefix, and date range.
- **Server-Side Pagination & Sorting**: Column headers support ascending and descending sort order.
- **Role-Based Row Actions**:
  - Receptionists can mark arrival (`POST /arrive`), edit visit purpose, or cancel visits.
  - Doctors can inspect patient details, add/update clinical consultation notes, and mark visits as completed (`POST /complete`).

### 3.3 Administrative Portals (`features/doctors` & `features/staff`)
- Restricted exclusively to `SUPER_ADMIN`.
- Onboard new physicians with custom working days, multi-session hours, break periods, and slot durations.
- Provision receptionist credentials.

---

## 4. Development & Build Scripts

Execute commands from the repository root using npm workspaces:

```bash
# Run client dev server with HMR (runs on http://localhost:5173)
npm run dev -w apps/client

# Build production bundle (outputs to dist/)
npm run build -w apps/client

# Preview compiled production build
npm run preview -w apps/client

# Run TypeScript typecheck without emit
npm run typecheck -w apps/client

# Run Biome linter on client sources
npm run lint -w apps/client

# Run Vitest component tests
npm run test -w apps/client
```

---

## 5. Development Server Proxy Configuration

Vite dev server is configured (`vite.config.ts`) to forward API and WebSocket calls to the local Express server:

```ts
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true
    },
    "/socket.io": {
      target: "http://localhost:3000",
      ws: true
    }
  }
}
```
This proxy setup prevents Cross-Origin Resource Sharing (CORS) friction and ensures `httpOnly` authentication cookies are seamlessly transmitted during local development.
