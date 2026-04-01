const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const connectDB = require('../config/db');

const User = require('../models/User');
const Factory = require('../models/Factory');
const Alert = require('../models/Alert');
const InspectionReport = require('../models/InspectionReport');

const seedData = async () => {
  try {
    await User.deleteMany();
    await Factory.deleteMany();
    await Alert.deleteMany();
    await InspectionReport.deleteMany();

    const passwordHash = await bcrypt.hash('password123', 10);

    const inspectors = [
        await User.create({ name: 'Inspector Raj', email: 'inspector@fire.com', password: passwordHash, role: 'inspector' }),
        await User.create({ name: 'Inspector Priya', email: 'inspector2@fire.com', password: passwordHash, role: 'inspector' }),
        await User.create({ name: 'Inspector Kumar', email: 'inspector3@fire.com', password: passwordHash, role: 'inspector' })
    ];
    
    const govt = await User.create({ name: 'Safety Authority', email: 'govt@fire.com', password: passwordHash, role: 'govt' });
    console.log('Inspectors and Govt Users seeded');

    const factoryDocs = [
      { name: 'Diwali Star Crackers', loc: 'Sivakasi, Hub A' },
      { name: 'Sky Fire Industries', loc: 'Virudhunagar, Zone 1' },
      { name: 'Apollo Fireworks', loc: 'Sivakasi, Hub B' },
      { name: 'Thunder Sparklers', loc: 'Chennai Outskirts' },
      { name: 'Golden Spark Mfg', loc: 'Madurai East' }
    ];

    for (let i = 0; i < factoryDocs.length; i++) {
        const ext = i === 0 ? '' : i + 1;
        const owner = await User.create({ name: `Owner ${i+1}`, email: `owner${ext}@fire.com`, password: passwordHash, role: 'owner' });
        
        // Dynamically assign inspector to distribute load (0->0, 1->1, 2->2, 3->0, 4->1)
        const assignedInspector = inspectors[i % inspectors.length];

        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 2);

        await Factory.create({
          name: factoryDocs[i].name,
          location: factoryDocs[i].loc,
          owner: owner._id,
          assignedInspector: assignedInspector._id,
          status: 'Safe',
          safetyScore: 90 + Math.floor(Math.random() * 10),
          lastInspectionDate: new Date(),
          nextInspectionDate: nextDate,
          currentData: {
            temperature: 30 + Math.random() * 5,
            gasLevel: 5 + Math.random() * 2,
            smokeLevel: 2 + Math.random() * 2,
            humidity: 45 + Math.random() * 10,
            isSimulated: true
          }
        });
    }

    console.log('5 Distinct Factories & Owners seeded');
    console.log('Seeding successful');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;
