import dotenv from "dotenv";
dotenv.config();
import Document from "../models/Document.js";
import Plot from "../models/Plot.js";
import mongoose from "mongoose";
import { GridFsStorage } from "multer-gridfs-storage";
import multer from "multer";

// Setup GridFS storage
const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: "documents"
    };
  }
});
export const upload = multer({ storage });

export const uploadDocument = async (req, res) => {
  const { plotId, type, description } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Check plot ownership
  const plot = await Plot.findOne({ _id: plotId, userId: req.user._id });
  if (!plot) return res.status(403).json({ message: "Unauthorized plot" });

  const doc = await Document.create({
    plotId,
    userId: req.user._id,
    fileName: req.file.filename,
    fileUrl: req.file.id, // GridFS file id
    type,
    description
  });
  res.status(201).json(doc);
};

export const getDocuments = async (req, res) => {
  const docs = await Document.find({ userId: req.user._id });
  res.json(docs);
};

export const getDocumentsByPlot = async (req, res) => {
  // Ensure plot belongs to user
  const plot = await Plot.findOne({ _id: req.params.plotId, userId: req.user._id });
  if (!plot) return res.status(403).json({ message: "Unauthorized plot" });
  const docs = await Document.find({ plotId: req.params.plotId, userId: req.user._id });
  res.json(docs);
};

export const deleteDocument = async (req, res) => {
  const doc = await Document.findById(req.params.docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (!doc.userId.equals(req.user._id)) return res.status(403).json({ message: "Unauthorized" });

  // Delete from GridFS
  const conn = mongoose.connection;
  const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "documents" });
  try {
    await bucket.delete(new mongoose.Types.ObjectId(doc.fileUrl));
  } catch (err) {
    // If file is already gone, continue
    if (err.code !== 'ENOENT') {
      return res.status(500).json({ message: 'Failed to delete file', error: err.message });
    }
  }
  await doc.deleteOne();
  res.json({ message: "Document deleted" });
};

export const downloadDocument = async (req, res) => {
  const doc = await Document.findById(req.params.docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (!doc.userId.equals(req.user._id)) return res.status(403).json({ message: "Unauthorized" });

  const conn = mongoose.connection;
  const bucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "documents" });
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename=\"${doc.fileName}\"`);
  bucket.openDownloadStream(new mongoose.Types.ObjectId(doc.fileUrl)).pipe(res);
}; 