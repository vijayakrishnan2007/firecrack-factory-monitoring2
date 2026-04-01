const express = require('express');
const Factory = require('../models/Factory');
const Alert = require('../models/Alert');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.inspectorId) filter.assignedInspector = req.query.inspectorId;
    if (req.query.ownerId) filter.owner = req.query.ownerId;
    
    const factories = await Factory.find(filter).populate('owner', 'name email').populate('assignedInspector', 'name email');
    res.json(factories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const factory = await Factory.findById(req.params.id).populate('owner', 'name email');
    res.json(factory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find({ factoryId: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
