// server/models/Report.js

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: Date, default: Date.now },
  format: { type: String, required: true },
  status: { type: String, default: 'Ready' },
  fileUrl: { type: String, required: true }, // Store relative file path
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
