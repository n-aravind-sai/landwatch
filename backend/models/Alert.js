import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    plotId: { type: mongoose.Schema.Types.ObjectId, ref: "Plot", required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, required: true },
    severity: { type: String, required: true },
    percentChange: { type: Number },
    source: { type: String, required: true, enum: ['manual', 'automated'] },
    status: { type: String, default: 'unread', enum: ['unread', 'acknowledged', 'resolved'] },
    title: { type: String, default: 'Change Detection' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema); 