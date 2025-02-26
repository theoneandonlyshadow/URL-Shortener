const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  full: { type: String, required: true },
  short: { type: String, required: true, unique: true },
  topic: String,
  clicks: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Url", urlSchema);