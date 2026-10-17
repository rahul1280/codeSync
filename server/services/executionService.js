const { spawn, exec } = require('child_process');
const env = require('../config/env');
const Execution = require('../models/Execution');
const { EXECUTION_STATUS } = require('../utils/constants');

const LANGUAGE_CONFIG = {
  javascript: {
    image: 'node:18-alpine',
    cmd: ['node', '-e']
  },
  python: {
    image: 'python:3.11-alpine',
    cmd: ['python3', '-c']
  }
};

/**
 * Check if Docker daemon is accessible
 */
function isDockerAvailable() {
  return new Promise((resolve) => {
    exec('docker info', { timeout: 3000 }, (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Execute code inside a locked-down Docker container
 */
async function runDockerContainer(language, code, timeoutMs) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported execution language: ${language}`);
  }

  const memoryLimit = env.DOCKER_MEMORY_LIMIT || '128m';
  const cpuLimit = env.DOCKER_CPU_LIMIT || '0.5';

  const dockerArgs = [
    'run',
    '--rm',
    '--network', 'none', // Disallow network access for sandbox security
    `--memory=${memoryLimit}`,
    `--cpus=${cpuLimit}`,
    config.image,
    ...config.cmd,
    code
  ];

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimeout = false;

    const child = spawn('docker', dockerArgs);

    const timer = setTimeout(() => {
      isTimeout = true;
      try {
        child.kill('SIGKILL');
      } catch (e) {
        // ignore
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Safeguard against output flood (max 500KB)
      if (stdout.length > 500000) {
        child.kill('SIGKILL');
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 500000) {
        child.kill('SIGKILL');
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;
      resolve({
        status: EXECUTION_STATUS.FAILED,
        output: stdout,
        error: `Process error: ${err.message}`,
        executionTime
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      if (isTimeout) {
        resolve({
          status: EXECUTION_STATUS.TIMEOUT,
          output: stdout,
          error: `Execution timed out after ${timeoutMs}ms`,
          executionTime
        });
      } else if (exitCode !== 0) {
        resolve({
          status: EXECUTION_STATUS.FAILED,
          output: stdout,
          error: stderr || `Process exited with code ${exitCode}`,
          executionTime
        });
      } else {
        resolve({
          status: EXECUTION_STATUS.COMPLETED,
          output: stdout,
          error: stderr,
          executionTime
        });
      }
    });
  });
}

/**
 * Fallback execution using host process when Docker is not running
 */
async function runLocalProcess(language, code, timeoutMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimeout = false;

    let cmd = 'node';
    let args = ['-e', code];

    if (language === 'python') {
      cmd = process.platform === 'win32' ? 'python' : 'python3';
      args = ['-c', code];
    } else if (language !== 'javascript') {
      return resolve({
        status: EXECUTION_STATUS.FAILED,
        output: '',
        error: `Direct execution is not supported for ${language}. Please start Docker.`,
        executionTime: 0
      });
    }

    const child = spawn(cmd, args);

    const timer = setTimeout(() => {
      isTimeout = true;
      try {
        child.kill();
      } catch (e) {
        // ignore
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 500000) child.kill();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 500000) child.kill();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        status: EXECUTION_STATUS.FAILED,
        output: stdout,
        error: `Execution error: ${err.message}`,
        executionTime: Date.now() - startTime
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime;

      if (isTimeout) {
        resolve({
          status: EXECUTION_STATUS.TIMEOUT,
          output: stdout,
          error: `Execution timed out after ${timeoutMs}ms`,
          executionTime
        });
      } else if (exitCode !== 0) {
        resolve({
          status: EXECUTION_STATUS.FAILED,
          output: stdout,
          error: stderr || `Process exited with code ${exitCode}`,
          executionTime
        });
      } else {
        resolve({
          status: EXECUTION_STATUS.COMPLETED,
          output: stdout,
          error: stderr,
          executionTime
        });
      }
    });
  });
}

/**
 * Execute code with DB record tracking
 */
async function executeCode({ userId, roomId = null, fileId = null, language, code }) {
  const execution = await Execution.create({
    userId,
    roomId,
    fileId,
    language,
    code,
    status: EXECUTION_STATUS.PENDING
  });

  execution.status = EXECUTION_STATUS.RUNNING;
  await execution.save();

  const timeoutMs = env.DOCKER_TIMEOUT_MS || 10000;
  const dockerReady = await isDockerAvailable();

  let result;
  if (dockerReady) {
    result = await runDockerContainer(language, code, timeoutMs);
  } else {
    result = await runLocalProcess(language, code, timeoutMs);
  }

  execution.status = result.status;
  execution.output = result.output;
  execution.error = result.error;
  execution.executionTime = result.executionTime;

  await execution.save();
  return execution;
}

async function getExecutionById(executionId) {
  return Execution.findById(executionId)
    .populate('userId', 'name email avatarColor');
}

module.exports = {
  isDockerAvailable,
  executeCode,
  getExecutionById
};
