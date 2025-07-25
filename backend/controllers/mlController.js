import {
  checkHealth,
  runChangeDetection,
  getLatestImage,
  downloadLatestImage as mlDownloadLatestImage
} from "../ml/mlService.js";
import Alert from "../models/Alert.js";
import Plot from "../models/Plot.js";

export const mlHealthCheck = async (req, res) => {
  const status = await checkHealth();
  res.json(status);
};

// Utility to convert [lat, lng] to GeoJSON [[[lng, lat], ...]]
function toGeoJsonPolygon(coordinates) {
  if (
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    Array.isArray(coordinates[0]) &&
    typeof coordinates[0][0] === 'number' &&
    typeof coordinates[0][1] === 'number'
  ) {
    let ring = coordinates.map(([lat, lng]) => [lng, lat]);
    if (ring.length < 3 || ring[0][0] !== ring[ring.length-1][0] || ring[0][1] !== ring[ring.length-1][1]) {
      ring.push([...ring[0]]);
    }
    return [ring];
  }
  return coordinates;
}

export const changeDetect = async (req, res) => {
  const { coordinates, plotId, threshold = 0.2, days = 20, relax_mask = false, apply_mask = true } = req.body;
  const geojsonCoords = toGeoJsonPolygon(coordinates);
  const result = await runChangeDetection(plotId, geojsonCoords, { threshold, days, relax_mask, apply_mask });
  // Always store an alert, even if percentChange is 0
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Alert.findOne({
    plotId,
    type: result.type || "vegetation_loss",
    severity: result.severity || "medium",
    percentChange: result.percentChange || 0,
    source: 'manual',
    createdAt: { $gte: since }
  });
  if (!existing) {
    const alert = await Alert.create({
      plotId,
      type: result.type || "vegetation_loss",
      severity: result.severity || "medium",
      percentChange: result.percentChange || 0,
      source: 'manual',
      status: 'unread',
      title: 'Change Detection',
      description: 'Manual detection run'
    });
    await Plot.findByIdAndUpdate(plotId, { $push: { alerts: alert._id } });
  }
  res.json(result);
};

export const latestImage = async (req, res) => {
  const { coordinates, plotId } = req.body;
  const geojsonCoords = toGeoJsonPolygon(coordinates);
  const image = await getLatestImage(plotId, geojsonCoords);
  res.json(image);
};

export const downloadLatestImage = async (req, res) => {
  const { coordinates, plotId } = req.body;
  const geojsonCoords = toGeoJsonPolygon(coordinates);
  const result = await mlDownloadLatestImage(plotId, geojsonCoords);
  res.json(result); // Send the download_url as JSON
}; 