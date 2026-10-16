# REST & Real-Time API Documentation

Enterprise Electronic Medical Record (EMR) Appointment Management System API Specification.

---

## 1. API Standards & Overview

- **Base URL (Local)**: `http://localhost:3000`
- **Versioned Prefix**: `/api/v1`
- **Wire Format**: `application/json`
- **Security**: HTTPS in production, CORS-restricted, Helmet HTTP security headers.
- **Authentication**: Stateless JSON Web Token (JWT) Access Token in `Authorization` header + HTTP-only Refresh Token cookie with single-use rotation.

---

## 2. Standard Response Format

All API responses strictly adhere to a consistent JSON envelope schema:

### Success Response Envelope
```json
{
  "success": true,
  "message": "Human-readable confirmation message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "message": "Primary error description",
  "errors": [
    {
      "path": "startTime",
      "message": "Start time must be formatted as HH:mm"
    }
  ]
}
```
*Note: `errors` contains granular field-level Zod validation issues when applicable.*

### HTTP Status Codes
| Code | Constant | Meaning |
| :--- | :--- | :--- |
| `200` | `OK` | Request succeeded; returned resource data. |
| `201` | `CREATED` | Resource successfully created (e.g. appointment, doctor). |
| `400` | `BAD_REQUEST` | Validation failed or malformed request payload/query. |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid authentication credentials. |
| `403` | `FORBIDDEN` | Authenticated user lacks required RBAC role permissions. |
| `404` | `NOT_FOUND` | Requested entity does not exist or is inaccessible. |
| `409` | `CONFLICT` | State conflict: slot already booked, duplicate mobile/email. |
| `422` | `UNPROCESSABLE_ENTITY`| Illegal lifecycle state machine transition. |
| `500` | `INTERNAL_SERVER_ERROR`| Unhandled server error (sanitized; details logged securely). |

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | Public | `SUPER_ADMIN` | `RECEPTIONIST` | `DOCTOR` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/auth/login` | POST | Yes | Yes | Yes | Yes |
| `/api/v1/auth/refresh` | POST | Yes* | Yes | Yes | Yes |
| `/api/v1/auth/logout` | POST | No | Yes | Yes | Yes |
| `/api/v1/auth/me` | GET | No | Yes | Yes | Yes |
| `/api/v1/doctors` | GET | No | Yes | Yes | Yes |
| `/api/v1/doctors` | POST | No | Yes | No | No |
| `/api/v1/doctors/:id` | PUT | No | Yes | No | No |
| `/api/v1/staff/receptionists`| GET/POST | No | Yes | No | No |
| `/api/v1/departments` | GET | No | Yes | Yes | Yes |
| `/api/v1/slots` | GET | No | Yes | Yes | Yes |
| `/api/v1/patients/search` | GET | No | Yes | Yes | No |
| `/api/v1/appointments` | POST | No | Yes | Yes | No |
| `/api/v1/appointments` | GET | No | Yes (All) | Yes (All) | Yes (Self only) |
| `/api/v1/appointments/:id` | GET | No | Yes (All) | Yes (All) | Yes (Self only) |
| `/api/v1/appointments/:id` | PUT | No | Yes | Yes (Purpose) | Yes (Notes only) |
| `/api/v1/appointments/:id` | DELETE | No | Yes | Yes | No |
| `/api/v1/appointments/:id/arrive` | POST | No | Yes | Yes | No |
| `/api/v1/appointments/:id/complete` | POST | No | Yes | No | Yes (Self only) |
| `/health` & `/api/v1/health` | GET | Yes | Yes | Yes | Yes |

*\*Requires valid HTTP-only refresh cookie.*

---

## 4. Endpoints Reference

### 4.1 Authentication Module

#### `POST /api/v1/auth/login`
Authenticates user credentials and establishes a session. Rate limited to 10 requests per 15 minutes per IP in production.

- **Access**: Public
- **Request Body**:
```json
{
  "email": "receptionist@emr.local",
  "password": "Recept@12345"
}
```
- **Response Headers**:
  - `Set-Cookie`: `refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "670c5b369324c5820ab05ef1",
      "name": "Amy Pond",
      "email": "receptionist@emr.local",
      "role": "RECEPTIONIST"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure on email or password.
  - `401 Unauthorized`: `"Invalid email or password"` (prevents account enumeration).

---

#### `POST /api/v1/auth/refresh`
Rotates the session. Verifies the cryptographically hashed refresh token stored in the database, invalidates it, issues a new refresh token cookie, and returns a fresh access token.

- **Access**: Public (Cookie-authenticated)
- **Cookies Required**: `refreshToken=<token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing cookie, expired token, or revoked token (replay attack detected).

---

#### `POST /api/v1/auth/logout`
Revokes the active refresh token in the database and clears the refresh cookie.

- **Access**: Authenticated (Any role)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

#### `GET /api/v1/auth/me`
Fetches the currently authenticated user's profile and active role.

- **Access**: Authenticated (Any role)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Current session retrieved",
  "data": {
    "id": "670c5b369324c5820ab05ef1",
    "name": "Amy Pond",
    "email": "receptionist@emr.local",
    "role": "RECEPTIONIST"
  }
}
```

---

### 4.2 Doctors & Staff Module

#### `GET /api/v1/doctors`
Lists all active physicians and their weekly scheduling templates.

- **Access**: Authenticated (Any role)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "670c5b369324c5820ab05ef2",
      "userId": "670c5b369324c5820ab05ef3",
      "name": "Dr. Sarah Chen",
      "department": "Cardiology",
      "schedule": {
        "workingDays": [1, 2, 3, 4, 5],
        "sessions": [
          { "start": "09:00", "end": "12:00" },
          { "start": "13:00", "end": "17:00" }
        ],
        "breaks": [
          { "start": "12:00", "end": "13:00" }
        ],
        "slotDuration": 15
      },
      "isActive": true
    }
  ]
}
```

---

#### `POST /api/v1/doctors`
Creates a doctor account and provisions their clinical practice schedule.

- **Access**: `SUPER_ADMIN`
- **Request Body**:
```json
{
  "name": "Dr. Gregory House",
  "email": "gregory.house@emr.local",
  "password": "Doctor@12345",
  "department": "Diagnostics",
  "schedule": {
    "workingDays": [1, 2, 3, 4, 5],
    "sessions": [
      { "start": "09:00", "end": "12:00" },
      { "start": "13:00", "end": "17:00" }
    ],
    "breaks": [
      { "start": "12:00", "end": "13:00" }
    ],
    "slotDuration": 20
  }
}
```
- **Validation Rules**:
  - `schedule.workingDays`: Array of integers `0`–`6` (0 = Sunday).
  - `schedule.sessions`: Non-empty array, `start < end`, no overlapping sessions.
  - `schedule.breaks`: All breaks must fall within session bounds and not overlap each other.
  - `schedule.slotDuration`: Integer between 5 and 60 minutes.
- **Response `201 Created`**: Returns created doctor profile DTO.

---

#### `PUT /api/v1/doctors/:id`
Updates an existing doctor's name, department, schedule configuration, or active status.

- **Access**: `SUPER_ADMIN`
- **URL Params**: `id` (24-char hex MongoDB ObjectId)
- **Response `200 OK`**: Returns updated doctor profile DTO.

---

#### `GET /api/v1/staff/receptionists`
Lists all receptionist user accounts.

- **Access**: `SUPER_ADMIN`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Receptionists retrieved successfully",
  "data": [
    {
      "id": "670c5b369324c5820ab05ef1",
      "name": "Amy Pond",
      "email": "receptionist@emr.local",
      "role": "RECEPTIONIST",
      "isActive": true
    }
  ]
}
```

---

#### `POST /api/v1/staff/receptionists`
Provisions a new receptionist user account.

- **Access**: `SUPER_ADMIN`
- **Request Body**:
```json
{
  "name": "Rory Williams",
  "email": "rory.williams@emr.local",
  "password": "Recept@12345"
}
```
- **Response `201 Created`**: Returns created user account DTO.

---

### 4.3 Departments Module

#### `GET /api/v1/departments`
Lists all active clinical hospital departments.

- **Access**: Authenticated (Any role)
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Departments retrieved successfully",
  "data": [
    { "id": "670c5b369324c5820ab05ee1", "name": "Cardiology" },
    { "id": "670c5b369324c5820ab05ee2", "name": "Neurology" },
    { "id": "670c5b369324c5820ab05ee3", "name": "Orthopedics" },
    { "id": "670c5b369324c5820ab05ee4", "name": "Pediatrics" }
  ]
}
```

---

### 4.4 Slots Module

#### `GET /api/v1/slots`
Calculates discrete consultation time slots on-demand for a given doctor on a specific date, merging active bookings to indicate availability.

- **Access**: Authenticated (Any role)
- **Query Parameters**:
  - `doctorId` *(required)*: Valid MongoDB ObjectId string.
  - `date` *(required)*: ISO date string `YYYY-MM-DD`. Cannot be a past date.
- **Example**: `GET /api/v1/slots?doctorId=670c5b369324c5820ab05ef2&date=2026-10-19`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Slots retrieved successfully",
  "data": [
    { "startTime": "09:00", "endTime": "09:15", "status": "AVAILABLE" },
    { "startTime": "09:15", "endTime": "09:30", "status": "BOOKED" },
    { "startTime": "09:30", "endTime": "09:45", "status": "AVAILABLE" },
    { "startTime": "09:45", "endTime": "10:00", "status": "AVAILABLE" }
  ]
}
```
- **Slot Engine Rules**:
  - Never generates slots during break periods (e.g. 12:00–13:00 lunch).
  - Never generates slots for non-working days.
  - Rejects past calendar dates with `400 Bad Request`.
  - On the current day, automatically filters out time slots earlier than current server time.

---

### 4.5 Patients Module

#### `GET /api/v1/patients/search`
Searches patients via indexed prefix regex across name, patient code, and mobile phone number.

- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`
- **Query Parameters**:
  - `query` *(required)*: Search term (min 1 character).
- **Example**: `GET /api/v1/patients/search?query=Alice`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Patients retrieved successfully",
  "data": [
    {
      "id": "670c5b369324c5820ab05ef5",
      "patientCode": "P000001",
      "name": "Alice Johnson",
      "mobile": "9876543201",
      "gender": "FEMALE",
      "dateOfBirth": "1990-05-15"
    }
  ]
}
```

---

### 4.6 Appointments Module

#### `POST /api/v1/appointments`
Books a new consultation appointment for either an existing or a new patient. Protected by database-level partial unique index constraints against concurrent race conditions.

- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`
- **Request Body (Existing Patient)**:
```json
{
  "doctorId": "670c5b369324c5820ab05ef2",
  "date": "2026-10-19",
  "startTime": "09:30",
  "purpose": "Routine cardiology checkup",
  "patient": {
    "type": "EXISTING",
    "patientId": "670c5b369324c5820ab05ef5"
  }
}
```
- **Request Body (New Patient - Atomic Registration)**:
```json
{
  "doctorId": "670c5b369324c5820ab05ef2",
  "date": "2026-10-19",
  "startTime": "09:45",
  "purpose": "First consultation for chest pain",
  "patient": {
    "type": "NEW",
    "name": "John Doe",
    "mobile": "9876543299",
    "gender": "MALE",
    "dateOfBirth": "1988-11-20"
  }
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": "670c5b369324c5820ab05efa",
    "doctorId": "670c5b369324c5820ab05ef2",
    "doctorName": "Dr. Sarah Chen",
    "patientId": "670c5b369324c5820ab05ef5",
    "patientCode": "P000001",
    "patientName": "Alice Johnson",
    "patientMobile": "9876543201",
    "department": "Cardiology",
    "date": "2026-10-19",
    "startTime": "09:30",
    "endTime": "09:45",
    "status": "SCHEDULED",
    "purpose": "Routine cardiology checkup",
    "createdAt": "2026-10-16T11:00:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure or slot not present on doctor's schedule.
  - `409 Conflict`: Slot was just booked by a concurrent user (`SlotConflictError`), or duplicate patient mobile.

---

#### `GET /api/v1/appointments`
Fetches a paginated and filtered list of appointments with server-side sorting.

- **Access**: Authenticated.
  - `SUPER_ADMIN` & `RECEPTIONIST`: Can view all appointments and filter by doctor/department.
  - `DOCTOR`: Automatically and strictly scoped to own doctor profile (query overrides any user-supplied `doctorId`).
- **Query Parameters**:
  - `doctorId` *(optional)*: Filter by doctor ObjectId.
  - `patientId` *(optional)*: Filter by patient ObjectId.
  - `department` *(optional)*: Filter by department name.
  - `status` *(optional)*: `SCHEDULED` | `ARRIVED` | `COMPLETED` | `CANCELLED`.
  - `mobile` *(optional)*: Prefix search on patient mobile number.
  - `dateFrom` *(optional)*: ISO date string `YYYY-MM-DD`.
  - `dateTo` *(optional)*: ISO date string `YYYY-MM-DD`.
  - `sortBy` *(optional, default `"date"`)*: Field name (`"date"`, `"startTime"`, `"status"`, `"createdAt"`).
  - `sortOrder` *(optional, default `"asc"`)*: `"asc"` | `"desc"`.
  - `page` *(optional, default `1`)*: Positive integer.
  - `limit` *(optional, default `10`)*: Integer between `1` and `100`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "670c5b369324c5820ab05efa",
      "doctorId": "670c5b369324c5820ab05ef2",
      "doctorName": "Dr. Sarah Chen",
      "patientId": "670c5b369324c5820ab05ef5",
      "patientCode": "P000001",
      "patientName": "Alice Johnson",
      "patientMobile": "9876543201",
      "department": "Cardiology",
      "date": "2026-10-19",
      "startTime": "09:30",
      "endTime": "09:45",
      "status": "SCHEDULED",
      "purpose": "Routine cardiology checkup"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### `GET /api/v1/appointments/:id`
Retrieves single appointment record by ID. Doctors are restricted to their own appointments (returns 404 if not owned).

- **Access**: Authenticated (Ownership enforced)
- **Response `200 OK`**: Returns appointment DTO.

---

#### `PUT /api/v1/appointments/:id`
Updates appointment details (purpose or clinical consultation notes).

- **Access**: `SUPER_ADMIN`, `RECEPTIONIST` (purpose), `DOCTOR` (consultation notes for own appointments).
- **Request Body**:
```json
{
  "purpose": "Updated reason for visit",
  "notes": "Patient reported mild fatigue. Prescribed follow-up ECG in 2 weeks."
}
```
- **Response `200 OK`**: Returns updated appointment DTO.

---

#### `DELETE /api/v1/appointments/:id`
Cancels an appointment. Atomically marks status as `CANCELLED` and sets `active: false`, releasing the slot from the partial unique index so it can be rebooked immediately.

- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`
- **Response `200 OK`**: Returns cancelled appointment DTO.

---

#### `POST /api/v1/appointments/:id/arrive`
Marks a patient as arrived at the clinic. Transitions status from `SCHEDULED` $\to$ `ARRIVED`.

- **Access**: `SUPER_ADMIN`, `RECEPTIONIST`
- **Response `200 OK`**: Returns appointment DTO with status `"ARRIVED"`.
- **Error Responses**:
  - `422 Unprocessable Entity`: Invalid lifecycle transition (e.g., if already `COMPLETED` or `CANCELLED`).

---

#### `POST /api/v1/appointments/:id/complete`
Marks a consultation as completed. Transitions status from `ARRIVED` $\to$ `COMPLETED`.

- **Access**: `SUPER_ADMIN`, `DOCTOR` (Doctor ownership enforced).
- **Response `200 OK`**: Returns appointment DTO with status `"COMPLETED"`.
- **Error Responses**:
  - `403 Forbidden`: Receptionists attempting to complete medical consultations.
  - `422 Unprocessable Entity`: Attempting to complete an appointment directly from `SCHEDULED` without marking `ARRIVED` first.

---

### 4.7 Health Module

#### `GET /health` & `GET /api/v1/health`
Liveness and readiness health check probe for orchestration (Docker, Kubernetes).

- **Access**: Public
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "status": "UP",
    "timestamp": "2026-10-16T11:00:00.000Z",
    "uptime": 142.3,
    "database": "CONNECTED"
  }
}
```

---

## 5. Real-Time WebSockets (Socket.IO)

The server exposes a WebSocket gateway on the same HTTP port (`ws://localhost:3000/socket.io`).

### 5.1 Authentication Handshake
Clients authenticate during the Socket.IO connection handshake by passing their JWT access token:
```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: accessToken },
  transports: ["websocket", "polling"]
});
```
*Connections without a valid, unexpired token are rejected immediately at the handshake stage.*

### 5.2 Room Subscriptions
Clients viewing the scheduler join room channels partitioned by doctor and date to avoid unnecessary network fanout:

#### Client $\to$ Server:
- `scheduler:join`: `{ "doctorId": "...", "date": "YYYY-MM-DD" }`
- `scheduler:leave`: `{ "doctorId": "...", "date": "YYYY-MM-DD" }`

### 5.3 Server Broadcast Events

| Event Name | Room / Target | Payload Interface | Trigger |
| :--- | :--- | :--- | :--- |
| `appointment:created` | `doctor:${doctorId}:${date}` | `AppointmentCreatedEvent` | An appointment is booked. |
| `appointment:updated` | `doctor:${doctorId}:${date}` | `AppointmentUpdatedEvent` | Status, notes, or purpose updated. |
| `appointment:cancelled`| `doctor:${doctorId}:${date}` | `AppointmentCancelledEvent`| An appointment is cancelled. |
| `slot:booked` | `doctor:${doctorId}:${date}` | `SlotBookedEvent` | Slot is reserved. |
| `slot:released` | `doctor:${doctorId}:${date}` | `SlotReleasedEvent` | Slot becomes available after cancellation. |

#### Event Payloads:
```ts
// appointment:created
{
  "appointment": { ...AppointmentDto },
  "doctorId": "670c5b369324c5820ab05ef2",
  "date": "2026-10-19",
  "startTime": "09:30",
  "endTime": "09:45"
}

// appointment:cancelled
{
  "appointment": { ...AppointmentDto },
  "doctorId": "670c5b369324c5820ab05ef2",
  "date": "2026-10-19",
  "startTime": "09:30",
  "endTime": "09:45"
}
```

When connected clients receive these events, the frontend invalidates the corresponding TanStack Query cache key:
```ts
queryClient.invalidateQueries({ queryKey: ["slots", doctorId, date] });
queryClient.invalidateQueries({ queryKey: ["appointments"] });
```
This guarantees real-time synchronization across multiple browser tabs without requiring manual page reloads.
