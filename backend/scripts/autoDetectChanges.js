import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Plot from '../models/Plot.js';
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import axios from 'axios';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendAlertEmail(to, plotName, percentChange, severity) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'alerts@landwatch.com',
    to,
    subject: `Landwatch Alert: ${severity.toUpperCase()} change detected`,
    text: `A ${severity} change (${percentChange}%) was detected on your plot: ${plotName}. Please review your dashboard for details.`,
    html: `<b>A ${severity} change (${percentChange}%) was detected on your plot: ${plotName}.</b><br/>Please review your dashboard for details.`
  });
}

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
      // Deduplication: check for similar alert in last 24h
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Alert.findOne({
        plotId: plot._id,
        type: 'change',
        severity,
        percentChange,
        source: 'automated',
        createdAt: { $gte: since }
      });
      if (!existing) {
        const alert = await Alert.create({
          plotId: plot._id,
          timestamp: new Date(),
          type: 'change',
          severity,
          percentChange,
          source: 'automated'
        });
        // Fetch user email
        const user = await User.findById(plot.userId);
        if (user && user.email) {
          await sendAlertEmail(user.email, plot.name, percentChange, severity);
          console.log(`Alert email sent to ${user.email} for plot ${plot.name}`);
        }
        console.log(`Alert created for plot ${plot._id} with severity ${severity} (${percentChange}%)`);
      }
    } catch (err) {
      console.error(`Failed to process plot ${plot._id}:`, err.message);
      // Send admin notification on error
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'alerts@landwatch.com',
          to: process.env.ADMIN_EMAIL || 'admin@landwatch.com',
          subject: `Landwatch Cron Failure: Plot ${plot._id}`,
          text: `Failed to process plot ${plot._id}: ${err.message}`,
        });
      } catch (emailErr) {
        console.error('Failed to send admin notification:', emailErr.message);
      }
    }
  }
  await mongoose.disconnect();
}

run(); 