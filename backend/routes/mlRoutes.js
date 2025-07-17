import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  mlHealthCheck,
  changeDetect,
  latestImage,
  downloadLatestImage
} from "../controllers/mlController.js";

const router = express.Router();

router.use(auth);
router.get("/health-check", mlHealthCheck);
router.post("/change-detect", changeDetect);
router.get("/latest-image", latestImage);
router.get("/download-latest-image", downloadLatestImage);
// Add POST routes for latest image and download to support coordinates in body
router.post("/latest-image", latestImage);
router.post("/download-latest-image", downloadLatestImage);

export default router; 