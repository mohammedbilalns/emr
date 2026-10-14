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
		logger.error({ error }, "MongoDB connection failed");
		process.exit(1);
	}
}

export async function disconnectDatabase(): Promise<void> {
	await mongoose.disconnect();
}
