export const APPOINTMENT_STATUS = ["SCHEDULED", "ARRIVED", "COMPLETED", "CANCELLED"] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};


