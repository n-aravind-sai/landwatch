import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  getPlots,
  createPlot,
  getPlotById,
  updatePlot,
  deletePlot
} from "../controllers/plotController.js";

const router = express.Router();

router.use(auth);
router.get("/", getPlots);
router.post("/", createPlot);
router.get("/:id", getPlotById);
router.put("/:id", updatePlot);
router.delete("/:id", deletePlot);

export default router; 