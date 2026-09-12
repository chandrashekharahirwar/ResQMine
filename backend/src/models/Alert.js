const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    index: true
  },
  riskScore: {
    type: Number,
    required: true
  },
  topFactor: {
    type: String,
    default: 'None'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  acknowledged: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledgedAt: {
    type: Date,
    default: null
  }
});

alertSchema.index({ acknowledged: 1, timestamp: -1 });

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
