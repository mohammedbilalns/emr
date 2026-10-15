import { patientSearchQuerySchema } from "@emr/shared";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { searchPatientsHandler } from "./patient.controller";

const router = Router();

// Search patients by name, patient code, or mobile phone number
router.get(
	"/search",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ query: patientSearchQuerySchema }),
	searchPatientsHandler,
);

export default router;
