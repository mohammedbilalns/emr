import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { API_PREFIX } from "./config/constants";
import { env } from "./config/env";
import { healthHandler } from "./controllers/health.controller";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/notfound.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import appointmentRoutes from "./routes/v1/appointments.routes";
import authRoutes from "./routes/v1/auth.routes";
import doctorRoutes from "./routes/v1/doctors.routes";
import patientRoutes from "./routes/v1/patients.routes";
import slotRoutes from "./routes/v1/slots.routes";
import staffRoutes from "./routes/v1/staff.routes";

/**
 * Initializes Express application with security middleware, request logging,
 * versioned API routes, and centralized error handling.
 */
export function createApp(): express.Application {
	const app = express();

	app.disable("x-powered-by");
	app.use(helmet());
	app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
	app.use(express.json({ limit: "100kb" }));
	app.use(cookieParser());
	app.use(requestLogger);

	app.get("/health", healthHandler);
	app.get(`${API_PREFIX}/health`, healthHandler);

	app.use(`${API_PREFIX}/auth`, authRoutes);
	app.use(`${API_PREFIX}/doctors`, doctorRoutes);
	app.use(`${API_PREFIX}/slots`, slotRoutes);
	app.use(`${API_PREFIX}/staff`, staffRoutes);
	app.use(`${API_PREFIX}/patients`, patientRoutes);
	app.use(`${API_PREFIX}/appointments`, appointmentRoutes);

	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
