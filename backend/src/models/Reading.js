const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  vibration: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  tempC: { type: Number, default: 0 },
  humidity: { type: Number, default: 0 },
  waterDetected: { type: Boolean, default: false },
  soundLevel: { type: Number, default: 0 },
  roofDistanceCm: { type: Number, default: 0 },
  gasPpm: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskFactors: [{ type: String }]
}, {
  // Can support native time-series if MongoDB server supports it, otherwise works as standard collection
  timeseries: {
    timeField: 'timestamp',
    metaField: 'zoneId',
    granularity: 'seconds'
  }
});

readingSchema.index({ zoneId: 1, timestamp: -1 });

module.exports = mongoose.models.Reading || mongoose.model('Reading', readingSchema);
