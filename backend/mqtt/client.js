const mqtt = require('mqtt');
const Factory = require('../models/Factory');
const Alert = require('../models/Alert');

module.exports = (io) => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com';
  const client = mqtt.connect(brokerUrl);

  const checkThresholds = async (factoryId, data) => {
    const alerts = [];
    if (data.temperature > 50) alerts.push({ message: `High Temperature detected: ${data.temperature.toFixed(1)}°C`, severity: 'Danger' });
    else if (data.temperature > 40) alerts.push({ message: `Temperature warning: ${data.temperature.toFixed(1)}°C`, severity: 'Warning' });

    if (data.gasLevel > 30) alerts.push({ message: `Gas leak detected: ${data.gasLevel.toFixed(1)}%`, severity: 'Danger' });
    if (data.smokeLevel > 20) alerts.push({ message: `Smoke detected: ${data.smokeLevel.toFixed(1)}%`, severity: 'Danger' });

    const newAlerts = [];
    for (const a of alerts) {
      const alert = new Alert({ factoryId, ...a });
      await alert.save();
      newAlerts.push(alert);
      io.emit('new_alert', alert);
    }
    return newAlerts;
  };

  client.on('connect', () => {
    console.log(`Connected to MQTT broker at ${brokerUrl}`);
    // Subscribe to atomic topics: factory/+/temperature, factory/+/humidity, factory/+/gas
    client.subscribe('factory/+/+', (err) => {
      if (!err) console.log('Subscribed to granular sensor topics');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const parts = topic.split('/');
      if (parts.length === 3 && parts[0] === 'factory') {
        const factoryId = parts[1];
        const sensorType = parts[2];
        const val = parseFloat(message.toString());
        
        if (factoryId.length === 24) {
          let updateField = '';
          if (sensorType === 'temperature') updateField = 'currentData.temperature';
          if (sensorType === 'humidity') updateField = 'currentData.humidity';
          if (sensorType === 'gas') updateField = 'currentData.gasLevel';
          
          if (updateField) {
            const updatedFactory = await Factory.findByIdAndUpdate(
              factoryId,
              { $set: { [updateField]: val, "currentData.isSimulated": false, "currentData.timestamp": new Date() } },
              { new: true }
            );

            if (updatedFactory) {
              const cd = updatedFactory.currentData;
              const safetyScore = Math.max(0, 100 - (cd.temperature > 40 ? 20 : 0) - (cd.gasLevel > 20 ? 30 : 0) - (cd.smokeLevel > 15 ? 30 : 0));
              const status = safetyScore < 50 ? 'Danger' : (safetyScore < 80 ? 'Warning' : 'Safe');

              updatedFactory.safetyScore = safetyScore;
              updatedFactory.status = status;
              await updatedFactory.save();

              io.emit('sensor_update', updatedFactory);
              global.lastMqttUpdate = Date.now();
              await checkThresholds(factoryId, cd);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing MQTT message', err);
    }
  });

  return client;
};
