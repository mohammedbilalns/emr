import { z } from "zod";

export const timeString = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be a valid HH:mm time (24-hour)");

export const dateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
	.refine((d) => !Number.isNaN(new Date(`${d}T00:00:00`).getTime()), {
		message: "Invalid calendar date",
	});

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
