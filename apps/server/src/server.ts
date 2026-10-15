import { createServer } from "node:http";
import { createApp } from "./app";
import { API_PREFIX } from "./config/constants";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import logger from "./logging/logger";

// ---------------------------------------------------------------------------
// Bootstrap function: initializes the database and creates the HTTP server
// ---------------------------------------------------------------------------
async function bootstrap(): Promise<void> {
	await connectDatabase();

	const httpServer = createServer(createApp());

	httpServer.listen(env.PORT, () => {
		logger.info(`API listening on http://localhost:${env.PORT}${API_PREFIX}`);
	});

	// Graceful shutdown handler
	const shutdown = (signal: string) => {
		logger.info({ signal }, "Shutting down gracefully");
		httpServer.close(() => {
			disconnectDatabase()
				.catch((error) => logger.error({ err: error }, "Disconnect failed"))
				.finally(() => process.exit(0));
		});
		setTimeout(() => process.exit(1), 10_000).unref(); // drain safety net
	};

	// Listen for termination signals
	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) =>
	logger.error({ reason }, "Unhandled rejection"),
);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
	logger.fatal({ err: error }, "Uncaught exception — exiting");
	process.exit(1);
});

void bootstrap();
