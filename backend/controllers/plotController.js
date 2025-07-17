import Plot from "../models/Plot.js";
import Alert from "../models/Alert.js";

export const getPlots = async (req, res) => {
  try {
    const plots = await Plot.find({ userId: req.user._id }).populate("alerts");
    res.json(plots);
  } catch (err) {
    console.error('Error in getPlots:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const createPlot = async (req, res) => {
  const { name, coordinates, area } = req.body;
  const plot = await Plot.create({
    name,
    coordinates,
    area,
    userId: req.user._id
  });
  res.status(201).json(plot);
};

export const getPlotById = async (req, res) => {
  const plot = await Plot.findOne({ _id: req.params.id, userId: req.user._id }).populate("alerts");
  if (!plot) return res.status(404).json({ message: "Plot not found" });
  res.json(plot);
};

export const updatePlot = async (req, res) => {
  const plot = await Plot.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  if (!plot) return res.status(404).json({ message: "Plot not found" });
  res.json(plot);
};

export const deletePlot = async (req, res) => {
  const plot = await Plot.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!plot) return res.status(404).json({ message: "Plot not found" });
  res.json({ message: "Plot deleted" });
}; 