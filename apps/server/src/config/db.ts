import mongoose from "mongoose";
import logger from "../logging/logger";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
	try {
		await mongoose.connect(env.MONGO_URI, {
			serverSelectionTimeoutMS: 10_000,
		});

		logger.info("MongoDB connected");
	} catch (error) {
		logger.error({ err: error }, "MongoDB connection failed");
		process.exit(1);
	}
}

export async function disconnectDatabase(): Promise<void> {
	await mongoose.disconnect();
}

export interface DatabaseHealth {
	status: "connected" | "disconnected" | "connecting" | "disconnecting";
	healthy: boolean;
	latencyMs?: number;
}

/**
 * Checks MongoDB connection state and measures roundtrip ping latency.
 */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
	const stateMap: Record<number, DatabaseHealth["status"]> = {
		0: "disconnected",
		1: "connected",
		2: "connecting",
		3: "disconnecting",
	};

	const status = stateMap[mongoose.connection.readyState] ?? "disconnected";

	if (mongoose.connection.readyState !== 1) {
		return { status, healthy: false };
	}

	try {
		const start = Date.now();
		if (mongoose.connection.db) {
			await mongoose.connection.db.admin().ping();
		}
		const latencyMs = Date.now() - start;
		return { status: "connected", healthy: true, latencyMs };
	} catch {
		return { status: "disconnected", healthy: false };
	}
}
