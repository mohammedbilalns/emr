import { z } from "zod";

export const patientSearchQuerySchema = z.object({
	q: z.string().trim().min(1, "Search term is required").max(100),
	limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type PatientSearchQuery = z.infer<typeof patientSearchQuerySchema>;
