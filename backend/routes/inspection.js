const express = require('express');
const InspectionReport = require('../models/InspectionReport');
const Factory = require('../models/Factory');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const reports = await InspectionReport.find().populate('factoryId', 'name location').sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const report = new InspectionReport(req.body);
    await report.save();
    
    if (req.body.factoryId) {
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 2);
      await Factory.findByIdAndUpdate(req.body.factoryId, {
        lastInspectionDate: new Date(),
        nextInspectionDate: nextDate,
        status: req.body.status === 'Violation' ? 'Danger' : 'Safe'
      });
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const report = await InspectionReport.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
