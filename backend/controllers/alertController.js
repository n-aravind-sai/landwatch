import Alert from "../models/Alert.js";
import Plot from "../models/Plot.js";

export const getAlerts = async (req, res) => {
  const plots = await Plot.find({ userId: req.user._id });
  const plotIds = plots.map((p) => p._id);
  const alerts = await Alert.find({ plotId: { $in: plotIds } });
  res.json(alerts);
};

export const getAlertsByPlot = async (req, res) => {
  const alerts = await Alert.find({ plotId: req.params.plotId });
  res.json(alerts);
}; 