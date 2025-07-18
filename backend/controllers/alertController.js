import Alert from "../models/Alert.js";
import Plot from "../models/Plot.js";

export const getAlerts = async (req, res) => {
  const plots = await Plot.find({ userId: req.user._id });
  const plotIds = plots.map((p) => p._id);
  const plotMap = Object.fromEntries(plots.map(p => [p._id.toString(), p.name]));
  const alerts = await Alert.find({ plotId: { $in: plotIds } }).lean();
  // Attach plotName, source, and percentChange to each alert
  alerts.forEach(alert => {
    alert.plotName = plotMap[alert.plotId.toString()] || '';
    alert.source = alert.source || 'automated';
    alert.percentChange = typeof alert.percentChange === 'number' ? alert.percentChange : 0;
  });
  res.json(alerts);
};

export const getAlertsByPlot = async (req, res) => {
  const plot = await Plot.findById(req.params.plotId);
  const alerts = await Alert.find({ plotId: req.params.plotId }).lean();
  alerts.forEach(alert => {
    alert.plotName = plot ? plot.name : '';
    alert.source = alert.source || 'automated';
    alert.percentChange = typeof alert.percentChange === 'number' ? alert.percentChange : 0;
  });
  res.json(alerts);
};

export const acknowledgeAlert = async (req, res) => {
  const { id } = req.params;
  const alert = await Alert.findByIdAndUpdate(id, { status: 'read' }, { new: true });
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json(alert);
}; 