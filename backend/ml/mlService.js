import axios from "axios";

const ML_URL = process.env.ML_SERVICE_URL;

export const checkHealth = async () => {
  try {
    const { data } = await axios.get(`${ML_URL}/health-check`, { timeout: 5000 });
    return data;
  } catch (err) {
    return { status: "down", error: err.message };
  }
};

export const runChangeDetection = async (coordinates) => {
  try {
    const { data } = await axios.post(`${ML_URL}/change-detect`, { coordinates }, { timeout: 10000 });
    return data;
  } catch (err) {
    return { change_detected: false, error: err.message };
  }
};

export const getLatestImage = async (coordinates) => {
  try {
    const { data } = await axios.post(`${ML_URL}/latest-image`, { coordinates }, { timeout: 10000 });
    // Normalize response for frontend
    return { imageUrl: data.best_thumbnail_url || data.imageUrl || data.url || null, ...data };
  } catch (err) {
    return { error: err.message };
  }
};

export const downloadLatestImage = async (coordinates) => {
  try {
    const response = await axios.post(`${ML_URL}/download-latest-image`, { coordinates }, {
      responseType: "stream",
      timeout: 20000
    });
    return response.data;
  } catch (err) {
    throw new Error("Download failed: " + err.message);
  }
}; 