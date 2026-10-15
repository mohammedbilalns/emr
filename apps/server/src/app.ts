import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { API_PREFIX } from "./config/constants";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error-handler.middleware";
import { notFoundHandler } from "./middlewares/notfound.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import authRoutes from "./routes/auth.routes";
import doctorRoutes from "./routes/v1/doctors.routes";
import slotRoutes from "./routes/v1/slots.routes";
import staffRoutes from "./routes/v1/staff.routes";

// ---------------------------------------------------------------------------
// Creates and configures the Express application
// ---------------------------------------------------------------------------
export function createApp() {
	const app = express();

	// Disable the "X-Powered-By" header for security
	app.disable("x-powered-by");

	// Enable CORS with credentials for frontend
	app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

	// Parse JSON bodies with size limit
	app.use(express.json({ limit: "100kb" }));

	// Parse URL-encoded bodies
	app.use(cookieParser());

	// Log incoming requests
	app.use(requestLogger);

	// Health check endpoint
	app.get(`${API_PREFIX}/health`, (_req, res) => {
		res.status(200).json({
			success: true,
			message: "OK",
			data: { uptime: process.uptime() },
		});
	});

	// Mount routes
	app.use(`${API_PREFIX}/auth`, authRoutes);
	app.use(`${API_PREFIX}/doctors`, doctorRoutes);
	app.use(`${API_PREFIX}/slots`, slotRoutes);
	app.use(`${API_PREFIX}/staff`, staffRoutes);

	// 404 handler for unmatched routes
	app.use(notFoundHandler);

	// Global error handler
	app.use(errorHandler);

	return app;
}
