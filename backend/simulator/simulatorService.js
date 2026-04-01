const Factory = require('../models/Factory');
const Alert = require('../models/Alert');

module.exports = (io) => {
  global.lastMqttUpdate = 0;

  const generateData = () => {
    // Normal bounds
    const baseTemp = 25 + Math.random() * 10;
    const baseGas = Math.random() * 5;
    const baseSmoke = Math.random() * 2;
    const humidity = 40 + Math.random() * 20;

    // Simulate occasional spikes (5% chance)
    const isSpike = Math.random() < 0.05;
    const temperature = isSpike ? baseTemp + 20 : baseTemp;
    const gasLevel = isSpike ? baseGas + 20 : baseGas;
    const smokeLevel = isSpike ? baseSmoke + 15 : baseSmoke;

    const safetyScore = Math.max(0, 100 - (temperature > 40 ? 20 : 0) - (gasLevel > 20 ? 30 : 0) - (smokeLevel > 15 ? 30 : 0));
    const status = safetyScore < 50 ? 'Danger' : (safetyScore < 80 ? 'Warning' : 'Safe');

    return { temperature, gasLevel, smokeLevel, humidity, safetyScore, status };
  };

  const startSimulation = () => {
    setInterval(async () => {
      try {
        if (Date.now() - global.lastMqttUpdate > 5000) {
          const factories = await Factory.find();
          for (let factory of factories) {
            const simulated = generateData();
            
            const newData = {
              temperature: simulated.temperature,
              gasLevel: simulated.gasLevel,
              smokeLevel: simulated.smokeLevel,
              humidity: simulated.humidity,
              timestamp: new Date(),
              isSimulated: true
            };

            const updatedFactory = await Factory.findByIdAndUpdate(
              factory._id,
              { 
                currentData: newData, 
                safetyScore: simulated.safetyScore, 
                status: simulated.status 
              },
              { new: true }
            );

            io.emit('sensor_update', updatedFactory);

            // Generate alerts if simulated data spikes
            if (simulated.status !== 'Safe') {
                const message = simulated.status === 'Danger' ? 'Simulated Critical Alert Triggered' : 'Simulated Warning Tripped';
                const alert = new Alert({ factoryId: factory._id, message, severity: simulated.status });
                await alert.save();
                io.emit('new_alert', alert);
            }
          }
        }
      } catch (err) {
        console.error('Simulation loop error:', err);
      }
    }, 3000);
  };

  startSimulation();
  console.log('Simulator service initialized (Fallback mode Active)');
};
