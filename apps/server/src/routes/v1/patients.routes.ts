import { patientSearchQuerySchema } from "@emr/shared";
import { Router } from "express";
import { searchPatientsHandler } from "../../controllers/patient.controller";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRoles } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.get(
	"/search",
	requireAuth,
	requireRoles("RECEPTIONIST", "SUPER_ADMIN"),
	validate({ query: patientSearchQuerySchema }),
	searchPatientsHandler,
);

export default router;
