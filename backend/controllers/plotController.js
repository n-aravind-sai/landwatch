import Plot from "../models/Plot.js";
import Alert from "../models/Alert.js";
import axios from 'axios';

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

export const detectChangeForPlot = async (req, res) => {
  const plot = await Plot.findOne({ _id: req.params.plotId, userId: req.user._id });
  if (!plot) return res.status(404).json({ message: "Plot not found or unauthorized" });

  // Convert [ [lat, lng], ... ] to [ [ [lon, lat], ... ] ]
  const geojsonPolygon = [plot.coordinates.map(([lat, lng]) => [lng, lat])];
  // Call ML service
  try {
    const { data } = await axios.post(process.env.ML_SERVICE_URL + '/detect-change', {
      plotId: plot._id,
      coordinates: geojsonPolygon
    });
    const percentChange = data.percentChange;
    // Determine severity
    let severity = 'low';
    if (percentChange > 30) severity = 'high';
    else if (percentChange > 15) severity = 'medium';
    else if (percentChange > 5) severity = 'low';
    else return res.json({ percentChange, alert: null, message: 'No significant change detected.' });

    // Create alert
    const alert = await (await import('../models/Alert.js')).default.create({
      plotId: plot._id,
      timestamp: new Date(),
      type: 'change',
      severity,
      percentChange
    });
    res.json({ percentChange, alert, message: `Alert created with severity: ${severity}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to detect change', error: err.message });
  }
}; 