import express from "express";
import auth from "../middleware/authMiddleware.js";
import { getAlerts, getAlertsByPlot, acknowledgeAlert } from "../controllers/alertController.js";

const router = express.Router();

router.use(auth);
router.get("/", getAlerts);
router.get("/plot/:plotId", getAlertsByPlot);
router.patch('/:id/acknowledge', acknowledgeAlert);

export default router; 