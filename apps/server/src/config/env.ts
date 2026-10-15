import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(5000),
	LOG_LEVEL: z
		.enum(["fatal", "error", "warn", "info", "debug", "trace"])
		.default("info"),
	MONGO_URI: z.string().min(1),
	JWT_ACCESS_SECRET: z.string().min(32),
	JWT_REFRESH_SECRET: z.string().min(32),
	JWT_ACCESS_TTL: z.string().default("15m"),
	JWT_REFRESH_TTL: z.string().default("7d"),
	CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.parse(process.env);

/**
 * Validated application runtime environment variables and derived helper flags.
 */
export const env = {
	...parsed,
	isDev: parsed.NODE_ENV === "development",
	isProd: parsed.NODE_ENV === "production",
};
