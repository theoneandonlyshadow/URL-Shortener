const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  shortUrl: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  os: String,
  device: String,
  location: {
    range: [Number], // IP range
    country: String,
    region: String,
    city: String,
    ll: [Number], // Latitude, Longitude
    metro: Number
  }
});

module.exports = mongoose.model("Analytics", analyticsSchema);
