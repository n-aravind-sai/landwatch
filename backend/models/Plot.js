import mongoose from "mongoose";

const plotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    coordinates: { type: Array, required: true },
    area: { type: Number },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastChecked: { type: Date },
    alerts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Alert" }]
  },
  { timestamps: true }
);

export default mongoose.model("Plot", plotSchema); 