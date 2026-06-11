import { Router } from "express";

import {
  getWhatsNew,
  createWhatsNew,
  updateWhatsNew,
  deleteWhatsNew,
} from "../controllers/whatsnew.controller.js";

const router = Router();

router.get("/", getWhatsNew);

router.post("/", createWhatsNew);

router.patch("/:id", updateWhatsNew);

router.delete("/:id", deleteWhatsNew);

export default router;