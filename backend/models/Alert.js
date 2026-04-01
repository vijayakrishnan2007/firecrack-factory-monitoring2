const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['Warning', 'Danger'], required: true },
  acknowledged: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
