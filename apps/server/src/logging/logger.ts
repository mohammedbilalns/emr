import pino from "pino";
import { env } from "../config/env";

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
});

export default logger;
