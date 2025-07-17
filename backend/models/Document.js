import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: "Plot", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema); 