import express from "express";
import multer from "multer";
import auth from "../middleware/authMiddleware.js";
import {
  uploadDocument,
  getDocuments,
  getDocumentsByPlot,
  deleteDocument
} from "../controllers/documentController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.use(auth);
router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/plot/:plotId", getDocumentsByPlot);
router.delete("/:docId", deleteDocument);

export default router; 