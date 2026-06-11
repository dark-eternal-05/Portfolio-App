import { Router } from "express";

import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/applications.controller.js";

const router = Router();

router.get("/", getApplications);

router.post("/", createApplication);

router.patch("/:id", updateApplication);

router.delete("/:id", deleteApplication);

export default router;