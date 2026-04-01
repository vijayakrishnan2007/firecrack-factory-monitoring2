const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checklist: {
    safetyConditions: { type: Boolean, default: false },
    fireExtinguishers: { type: Boolean, default: false },
    ventilation: { type: Boolean, default: false },
    workerGear: { type: Boolean, default: false }
  },
  remarks: { type: String },
  status: { type: String, enum: ['Compliant', 'Violation'], required: true },
  date: { type: Date, default: Date.now },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('InspectionReport', inspectionSchema);
