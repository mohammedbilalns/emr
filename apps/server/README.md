# EMR Backend Server (`apps/server`)

> High-reliability RESTful API and Real-Time WebSocket Gateway for the Enterprise Electronic Medical Record (EMR) Appointment Management System, built with **Node.js**, **Express 5**, **MongoDB**, **Mongoose 8**, and **Socket.IO**.

---

## 1. Overview & Architecture

The backend service is responsible for business logic execution, data integrity, concurrency protection, authentication, and broadcasting real-time updates.

### Unidirectional Architectural Lifecycle:
$$\text{HTTP Request} \longrightarrow \text{Zod Validator} \longrightarrow \text{JWT / RBAC} \longrightarrow \text{Controller} \longrightarrow \text{Service} \longrightarrow \text{Mongoose} \longrightarrow \text{DTO Mapper}$$

- **Zero Repository Boilerplate**: Mongoose models are called directly within services using `.lean()` and targeted projections, maintaining clean code without pass-through indirection.
- **Service Layer Ownership**: All business logic (slot availability checks, transaction boundaries, state machine validations, audit logging, and socket event emissions) lives inside dedicated services.
- **DTO Mappers**: Sensitive internal fields (`passwordHash`, `__v`, internal tracking flags) are explicitly projected out before responses are returned.

---

## 2. Directory Structure

```
apps/server/src/
├── config/                          # Configuration & runtime setup
│   ├── constants.ts                 # API prefixes, HTTP status codes, audit actions
│   ├── db.ts                        # Mongoose database connection lifecycle
│   └── env.ts                       # Typed Zod environment variable parser
│
├── errors/                          # Typed domain error classes
│   └── base.error.ts                # BaseError, ConflictError, SlotConflictError, NotFoundError, ValidationError
│
├── logging/                         # Structured logging
│   └── logger.ts                    # Pino logger with pino-pretty in dev
│
├── middlewares/                     # Express middleware pipeline
│   ├── auth.middleware.ts           # JWT bearer token verification
│   ├── error-handler.middleware.ts  # Centralized error handler (maps domain errors, Zod, E11000, JWT)
│   ├── notfound.middleware.ts       # 404 catch-all handler
│   ├── rbac.middleware.ts           # Role-based route authorization
│   ├── request-logger.middleware.ts # HTTP request/response logging
│   └── validate.middleware.ts       # Request schema validation (body, query, params)
│
├── modules/                         # Domain modules
│   ├── appointments/                # Booking, lifecycle, query services, Mongoose model, socket events
│   │   ├── services/
│   │   │   ├── appointment-booking.service.ts   # Atomic booking & conflict recovery
│   │   │   ├── appointment-lifecycle.service.ts # State transitions & cancellation
│   │   │   └── appointment-query.service.ts     # Filtered, paginated, and role-scoped listings
│   │   ├── appointment.controller.ts
│   │   ├── appointment.mapper.ts
│   │   ├── appointment.model.ts
│   │   └── appointment.routes.ts
│   ├── audit/                       # Audit logging service & model
│   ├── auth/                        # User authentication, token rotation, user & refresh token models
│   ├── departments/                 # Department directory service, controller, and model
│   ├── doctors/                     # Doctor & receptionist onboarding, controller, model, staff routes
│   ├── health/                      # System health check probes
│   ├── patients/                    # Patient directory, prefix search, counter sequence model
│   └── slots/                       # Pure mathematical slot generation algorithm
│
├── scripts/                         # CLI utilities & data migration scripts
│   ├── add-department.ts            # CLI script to provision clinical departments
│   └── migrate-departments.ts       # Migration utility for department normalization
│
├── seed/                            # Deterministic database seeding
│   └── seed.ts                      # Populates accounts, doctors, schedules, patients, appointments
│
├── sockets/                         # WebSocket gateway
│   └── socket.server.ts             # Socket.IO initialization & handshake JWT authentication
│
├── utils/                           # Core utilities
│   ├── api-response.ts              # Standard success response helper & pagination meta builder
│   ├── cookies.ts                   # HTTP-only refresh cookie configuration
│   ├── hash.ts                      # bcryptjs password hashing (12 rounds) & SHA-256 token hashing
│   ├── jwt.ts                       # Access & refresh token signing and verification
│   ├── mongo-errors.ts              # E11000 duplicate key & code 112 write conflict detectors
│   └── regex.ts                     # Regex special character escaping
│
├── app.ts                           # Express application factory with security middleware
└── server.ts                        # HTTP & Socket.IO server startup listener
```

---

## 3. Core Engine Mechanics

### 3.1 Double-Booking Guard
Duplicate bookings are strictly prevented via a **compound partial unique index**:
```ts
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { active: true } }
);
```
- Only active bookings hold the unique lock.
- Cancelling an appointment sets `active: false`, which atomically drops the document from the partial index and immediately releases the slot for rebooking.
- Simultaneous concurrent booking collisions throw `E11000` or `WriteConflict (code 112)`, which is automatically translated to a clean HTTP 409 `SlotConflictError`.

### 3.2 Pure In-Memory Slot Engine (`generateSlots`)
Theoretical consultation slots are calculated dynamically on-demand from the doctor's weekly schedule template.
- Integer minute arithmetic (`09:30` $\to$ `570`).
- Slices multi-session working hours into discrete durations (5–60 min).
- Mathematical collision check eliminates all slots overlapping doctor breaks:
  $$b_{\text{start}} < t_{\text{end}} \quad \text{AND} \quad t_{\text{start}} < b_{\text{end}}$$
- Eliminates past calendar dates and already elapsed hours on the current date.
- Zero stored slot documents in the database eliminates slot synchronization issues.

### 3.3 Security & Role-Based Access Control (RBAC)
- **Password Security**: Passwords hashed with `bcryptjs` using 12 salt rounds.
- **Dual-Token Rotation**: Short-lived (15 min) JWT access token + long-lived (7 day) refresh token stored in an `httpOnly`, `secure`, `sameSite: "strict"` cookie.
- **Hashed Refresh Tokens**: Refresh tokens are cryptographically hashed using SHA-256 before insertion into MongoDB, preventing token theft if database dumps are compromised.
- **Doctor Resource Isolation**: When a doctor requests appointments, the query is scoped strictly to their verified doctor ID. Querying another physician's appointment ID returns HTTP 404 to prevent resource enumeration.

---

## 4. Development & Running Scripts

Execute commands from the repository root using npm workspaces:

```bash
# Start backend in development mode with watch / live-reload (port 3000)
npm run dev -w apps/server

# Seed database with default admin, receptionist, doctors, patients, and schedules
npm run seed -w apps/server

# Add a clinical department via CLI
npm run add:department -w apps/server -- "Dermatology"

# Run department normalization migration
npm run migrate:departments -w apps/server

# Run Vitest integration and unit tests
npm run test -w apps/server

# Run TypeScript typecheck without emit
npm run typecheck -w apps/server

# Build production bundle (compiles server via esbuild)
npm run build -w apps/server

# Start compiled production build
npm run start -w apps/server
```

---

## 5. Environment Variables (`apps/server/.env`)

Configure the environment by copying `.env.example`:
```bash
cp apps/server/.env.example apps/server/.env
```

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production` |
| `PORT` | No | `3000` | HTTP & WebSocket server port |
| `MONGO_URI` | **Yes** | `mongodb://localhost:27017/emr` | MongoDB connection URI |
| `JWT_ACCESS_SECRET` | **Yes** | — | Cryptographic secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET`| **Yes** | — | Cryptographic secret for refresh tokens (min 32 chars) |
| `JWT_ACCESS_TTL` | No | `15m` | Access token lifespan (e.g. `15m`) |
| `JWT_REFRESH_TTL` | No | `7d` | Refresh token lifespan (e.g. `7d`) |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin for frontend |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`) |
