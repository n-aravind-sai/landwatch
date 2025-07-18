import express from "express";
import multer from "multer";
import auth from "../middleware/authMiddleware.js";
import { upload, uploadDocument, getDocuments, getDocumentsByPlot, deleteDocument, downloadDocument, viewDocument } from "../controllers/documentController.js";

const router = express.Router();

router.use(auth);
router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/plot/:plotId", getDocumentsByPlot);
router.delete("/:docId", deleteDocument);
router.get("/download/:docId", downloadDocument);
router.get("/view/:docId", viewDocument);

export default router; 