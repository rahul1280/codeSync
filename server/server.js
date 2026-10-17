const http = require('http');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');
const initSocket = require('./socket');

async function startServer() {
  try {
    // 1. Validate environment configuration
    env.validateEnv();

    // 2. Connect to MongoDB database
    await connectDB();

    // 3. Create HTTP server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO
    const io = initSocket(server);
    app.set('io', io);

    // 5. Start listening
    const PORT = env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`[Server] CodeSync server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server] Startup error: ${error.message}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = startServer;
