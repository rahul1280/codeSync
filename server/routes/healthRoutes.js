const express = require('express');
const mongoose = require('mongoose');
const { success } = require('../utils/responseHelper');
const packageJson = require('../package.json');

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const uptime = process.uptime();

  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    database: dbStatus
  });
});

router.get('/version', (req, res) => {
  return success(res, {
    name: packageJson.name,
    version: packageJson.version,
    node: process.version
  });
});

module.exports = router;
