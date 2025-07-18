import dotenv from "dotenv";
dotenv.config();
import Document from "../models/Document.js";
import Plot from "../models/Plot.js";
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

export const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // or 'public-read' if you want public files
    key: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Add file validation if needed
    cb(null, true);
  }
});

export const uploadDocument = async (req, res) => {
  const { plotId, type, description } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Check plot ownership
  const plot = await Plot.findOne({ _id: plotId, userId: req.user._id });
  if (!plot) return res.status(403).json({ message: "Unauthorized plot" });

  const doc = await Document.create({
    plotId,
    userId: req.user._id,
    fileName: req.file.originalname,
    fileUrl: req.file.location, // S3 file URL
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

  // Delete from S3
  const s3Key = doc.fileUrl.split('/').slice(-1)[0];
  try {
    await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET, Key: s3Key }).promise();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete file from S3', error: err.message });
  }
  await doc.deleteOne();
  res.json({ message: "Document deleted" });
};

export const downloadDocument = async (req, res) => {
  const doc = await Document.findById(req.params.docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (!doc.userId.equals(req.user._id)) return res.status(403).json({ message: "Unauthorized" });

  // Generate a signed URL for download
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: doc.fileUrl.split('/').slice(-1)[0],
    Expires: 60, // URL valid for 60 seconds
    ResponseContentDisposition: `attachment; filename=\"${doc.fileName}\"`
  };
  try {
    const url = s3.getSignedUrl('getObject', params);
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate download URL', error: err.message });
  }
};

export const viewDocument = async (req, res) => {
  const doc = await Document.findById(req.params.docId);
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (!doc.userId.equals(req.user._id)) return res.status(403).json({ message: "Unauthorized" });

  const s3Key = doc.fileUrl.split('/').slice(-1)[0];
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Expires: 60, // URL valid for 60 seconds
    ResponseContentDisposition: `inline; filename=\"${doc.fileName}\"`
  };
  try {
    const url = s3.getSignedUrl('getObject', params);
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate view URL', error: err.message });
  }
}; 