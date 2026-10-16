import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { listDepartments } from "./department.controller";

const router = Router();

// List all clinical departments
router.get("/", requireAuth, listDepartments);

export default router;
