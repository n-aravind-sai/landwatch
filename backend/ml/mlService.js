console.log('DEBUG: mlService.js loaded');
import axios from "axios";

export const checkHealth = async () => {
  const ML_URL = process.env.ML_SERVICE_URL;
  try {
    const { data } = await axios.get(`${ML_URL}/health-check`, { timeout: 5000 });
    return data;
  } catch (err) {
    return { status: "down", error: err.message };
  }
};

export const runChangeDetection = async (plotId, coordinates, options = {}) => {
  const ML_URL = process.env.ML_SERVICE_URL;
  const {
    threshold = 0.2,
    days = 20,
    relax_mask = false,
    apply_mask = true
  } = options;
  try {
    const { data } = await axios.post(`${ML_URL}/detect-change`, {
      plotId,
      coordinates,
      threshold,
      days,
      relax_mask,
      apply_mask
    }, { timeout: 10000 });
    return data;
  } catch (err) {
    return { change_detected: false, error: err.message };
  }
};

export const getLatestImage = async (plotId, coordinates) => {
  const ML_URL = process.env.ML_SERVICE_URL;
  console.log('DEBUG: getLatestImage called');
  try {
    console.log('DEBUG: About to call ML service');
    const { data } = await axios.post(`${ML_URL}/latest-image`, { plotId, coordinates }, { timeout: 10000 });
    console.log('ML Service /latest-image response:', data); // Debug log
    return { imageUrl: data.best_thumbnail_url || null };
  } catch (err) {
    console.log('DEBUG: Error calling ML service:', err);
    return { error: err.message };
  }
};

export const downloadLatestImage = async (plotId, coordinates) => {
  const ML_URL = process.env.ML_SERVICE_URL;
  console.log('DEBUG: downloadLatestImage called');
  try {
    const response = await axios.post(`${ML_URL}/download-latest-image`, { plotId, coordinates }, {
      responseType: "json",
      timeout: 20000
    });
    console.log('ML Service /download-latest-image response:', response.data); // Debug log
    return response.data;
  } catch (err) {
    throw new Error("Download failed: " + err.message);
  }
}; 