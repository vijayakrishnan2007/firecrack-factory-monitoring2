const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const seedData = require('./seed/seed');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware to inject io into requests if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const factoryRoutes = require('./routes/factory');
const inspectionRoutes = require('./routes/inspection');

app.use('/api/auth', authRoutes);
app.use('/api/factory', factoryRoutes);
app.use('/api/inspection', inspectionRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedData();
  
  // Start IoT / Simulator services
  require('./mqtt/client')(io);
  require('./simulator/simulatorService')(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
