import { createServer } from "node:http";
import { createApp } from "./app";
import { API_PREFIX } from "./config/constants";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import logger from "./logging/logger";

async function bootstrap(): Promise<void> {
	await connectDatabase();

	const httpServer = createServer(createApp());
	httpServer.listen(env.PORT, () => {
		logger.info(`API listening on http://localhost:${env.PORT}${API_PREFIX}`);
	});

	const shutdown = (signal: string) => {
		logger.info({ signal }, "Shutting down gracefully");
		httpServer.close(() => {
			disconnectDatabase()
				.catch((error) => logger.error({ error }, "Disconnect failed"))
				.finally(() => process.exit(0));
		});
		setTimeout(() => process.exit(1), 10_000).unref(); // drain safety net
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) =>
	logger.error({ reason }, "Unhandled rejection"),
);
process.on("uncaughtException", (error) => {
	logger.fatal({ error }, "Uncaught exception — exiting");
	process.exit(1);
});

void bootstrap();
