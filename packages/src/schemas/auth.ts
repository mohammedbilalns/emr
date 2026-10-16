import { z } from "zod";

export const loginSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z
		.string({ error: "Password is required" })
		.min(1, "Password is required")
		.min(8, "Password must be at least 8 characters"),
});
export type LoginBody = z.infer<typeof loginSchema>;
