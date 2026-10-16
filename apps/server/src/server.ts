import { createServer } from "node:http";
import { createApp } from "./app";
import { API_PREFIX } from "./config/constants";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import logger from "./logging/logger";
import { closeSocketServer, initSocketServer } from "./sockets";

async function bootstrap(): Promise<void> {
	await connectDatabase();

	const httpServer = createServer(createApp());
	initSocketServer(httpServer);

	httpServer.listen(env.PORT, () => {
		logger.info(`API listening on http://localhost:${env.PORT}${API_PREFIX}`);
		logger.info(`WebSocket server Running on ${env.PORT}`);
	});

	const shutdown = (signal: string) => {
		logger.info({ signal }, "Shutting down gracefully");
		closeSocketServer();
		httpServer.close(() => {
			disconnectDatabase()
				.catch((error) => logger.error({ err: error }, "Disconnect failed"))
				.finally(() => process.exit(0));
		});
		setTimeout(() => process.exit(1), 10_000).unref();
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) =>
	logger.error({ reason }, "Unhandled rejection"),
);

process.on("uncaughtException", (error) => {
	logger.fatal({ err: error }, "Uncaught exception — exiting");
	process.exit(1);
});

void bootstrap();
