import Document from "../models/Document.js";
import Plot from "../models/Plot.js";
import fs from "fs";

export const uploadDocument = async (req, res) => {
  const { plotId } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const doc = await Document.create({
    plotId,
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`
  });
  res.status(201).json(doc);
};

export const getDocuments = async (req, res) => {
  const plots = await Plot.find({ userId: req.user._id });
  const plotIds = plots.map((p) => p._id);
  const docs = await Document.find({ plotId: { $in: plotIds } });
  res.json(docs);
};

export const getDocumentsByPlot = async (req, res) => {
  const docs = await Document.find({ plotId: req.params.plotId });
  res.json(docs);
};

export const deleteDocument = async (req, res) => {
  const doc = await Document.findById(req.params.docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  // Remove file from disk
  fs.unlinkSync(`./uploads/${doc.fileName}`);
  await doc.deleteOne();
  res.json({ message: "Document deleted" });
}; 