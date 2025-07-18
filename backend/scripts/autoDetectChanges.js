import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Plot from '../models/Plot.js';
import Alert from '../models/Alert.js';
import axios from 'axios';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const plots = await Plot.find({});
  for (const plot of plots) {
    try {
      // Convert [ [lat, lng], ... ] to [ [ [lon, lat], ... ] ]
      const geojsonPolygon = [plot.coordinates.map(([lat, lng]) => [lng, lat])];
      const { data } = await axios.post(process.env.ML_SERVICE_URL + '/detect-change', {
        plotId: plot._id,
        coordinates: geojsonPolygon
      });
      const percentChange = data.percentChange;
      let severity = 'low';
      if (percentChange > 30) severity = 'high';
      else if (percentChange > 15) severity = 'medium';
      else if (percentChange > 5) severity = 'low';
      else continue;
      await Alert.create({
        plotId: plot._id,
        timestamp: new Date(),
        type: 'change',
        severity,
        percentChange
      });
      console.log(`Alert created for plot ${plot._id} with severity ${severity} (${percentChange}%)`);
    } catch (err) {
      console.error(`Failed to process plot ${plot._id}:`, err.message);
    }
  }
  await mongoose.disconnect();
}

run(); 