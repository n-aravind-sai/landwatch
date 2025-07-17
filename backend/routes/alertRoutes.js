import express from "express";
import auth from "../middleware/authMiddleware.js";
import { getAlerts, getAlertsByPlot } from "../controllers/alertController.js";

const router = express.Router();

router.use(auth);
router.get("/", getAlerts);
router.get("/plot/:plotId", getAlertsByPlot);

export default router; 