const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedInspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Safe', 'Warning', 'Danger'], default: 'Safe' },
  safetyScore: { type: Number, default: 100 },
  lastInspectionDate: { type: Date },
  nextInspectionDate: { type: Date },
  currentData: {
    temperature: { type: Number, default: 0 },
    gasLevel: { type: Number, default: 0 },
    smokeLevel: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    isSimulated: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Factory', factorySchema);
