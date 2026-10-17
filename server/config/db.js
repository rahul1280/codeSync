const mongoose = require('mongoose');
const env = require('./env');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

let isConnected = false;

async function connectDB(retries = MAX_RETRIES) {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const uri = env.MONGODB_URI;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      isConnected = true;
      console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}`);
      return;
    } catch (error) {
      console.error(`[Database] Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
      }
      console.log(`[Database] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected');
  }
}

module.exports = {
  connectDB,
  disconnectDB
};
