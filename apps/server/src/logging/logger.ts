import path from "node:path";
import pino from "pino";
import { env } from "../config/env";

/**
 * Application logger instance.
 *
 * - In development: pretty-prints structured logs to the console using pino-pretty.
 * - In production: persists logs to disk with daily date-based rotation using pino-roll,
 *   retaining only the last week's log files (7-day retention).
 * - Sensitive credentials (passwords, tokens, authorization cookies) are redacted across all environments.
 */
const logger = pino({
	level: env.LOG_LEVEL,
	redact: {
		paths: [
			"password",
			"*.password",
			"*.passwordHash",
			"token",
			"*.token",
			"refreshToken",
			"accessToken",
			"req.headers.authorization",
			"req.headers.cookie",
		],
		censor: "[REDACTED]",
	},
	...(env.isDev && {
		transport: {
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:HH:MM:ss.l",
				ignore: "pid,hostname",
			},
		},
	}),
	...(env.isProd && {
		transport: {
			target: "pino-roll",
			options: {
				file: path.join("logs", "app"),
				frequency: "daily",
				dateFormat: "yyyy-MM-dd",
				limit: {
					count: 7,
				},
				mkdir: true,
			},
		},
	}),
});

export default logger;
