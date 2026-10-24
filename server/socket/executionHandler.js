const { spawn, exec } = require('child_process');
const env = require('../config/env');
const Execution = require('../models/Execution');
const { EXECUTION_STATUS, EXECUTABLE_LANGUAGES } = require('../utils/constants');

// Track one active execution per socket to prevent abuse
const activeExecutions = new Map(); // socketId -> { child, timer, execution }

// Cache docker availability to avoid 3s overhead on every execution
let cachedDockerAvailable = null;
let lastDockerCheck = 0;

/**
 * Check if Docker daemon is accessible (cached for 60 seconds)
 */
function isDockerAvailable() {
  const now = Date.now();
  if (cachedDockerAvailable !== null && now - lastDockerCheck < 60000) {
    return Promise.resolve(cachedDockerAvailable);
  }

  return new Promise((resolve) => {
    exec('docker info', { timeout: 800 }, (error) => {
      cachedDockerAvailable = !error;
      lastDockerCheck = Date.now();
      resolve(cachedDockerAvailable);
    });
  });
}

/**
 * Wrap JavaScript code to support synchronous prompt()-like interactive input.
 * In node.js, fs.readSync(0, buf) reads from stdin synchronously line-by-line,
 * making prompt("message") work synchronously just like in browser JavaScript!
 */
function wrapJavaScriptForInteractiveInput(code) {
  if (!/\bprompt\s*\(/.test(code)) {
    return code;
  }

  const helper = `
function prompt(message) {
  if (message !== undefined && message !== null) {
    process.stdout.write(String(message));
  }
  const fs = require('fs');
  const buf = Buffer.alloc(1);
  let line = '';
  while (true) {
    let bytesRead = 0;
    try {
      bytesRead = fs.readSync(0, buf, 0, 1, null);
    } catch (e) {
      break;
    }
    if (bytesRead === 0) break;
    const char = buf.toString('utf8', 0, 1);
    if (char === '\\n') break;
    if (char === '\\r') continue;
    line += char;
  }
  return line;
}
`;
  return helper + '\n' + code;
}

/**
 * Kill an active execution for a socket
 */
function killExecution(socketId) {
  const active = activeExecutions.get(socketId);
  if (active) {
    clearTimeout(active.timer);
    try {
      active.child.kill('SIGKILL');
    } catch (_) { /* already dead */ }
    activeExecutions.delete(socketId);
  }
}

/**
 * Register interactive execution event handlers on a socket
 */
function registerExecutionHandlers(io, socket) {

  /**
   * exec:start — Start an interactive code execution
   */
  socket.on('exec:start', async (data) => {
    try {
      // If one execution is already running on this socket, stop it cleanly first
      if (activeExecutions.has(socket.id)) {
        killExecution(socket.id);
      }

      const { language, code, roomId, fileId } = data || {};

      // Validate
      if (!language || !code) {
        socket.emit('exec:error', { message: 'Language and code are required.' });
        return;
      }

      if (!EXECUTABLE_LANGUAGES.includes(language)) {
        socket.emit('exec:error', {
          message: `Language "${language}" is not supported for execution. Supported: ${EXECUTABLE_LANGUAGES.join(', ')}`
        });
        return;
      }

      if (Buffer.byteLength(code, 'utf8') > 50 * 1024) {
        socket.emit('exec:error', { message: 'Code exceeds maximum allowed size of 50KB.' });
        return;
      }

      // Create execution record in DB (non-blocking for execution start)
      let execution = null;
      try {
        const userId = socket.user?._id || socket.user?.id;
        if (userId) {
          execution = await Execution.create({
            userId,
            roomId: roomId || null,
            fileId: fileId || null,
            language,
            code,
            status: EXECUTION_STATUS.RUNNING
          });
        }
      } catch (dbErr) {
        console.warn('[Exec] DB create warning:', dbErr.message);
      }

      // Check Docker status
      let dockerReady = false;
      try {
        dockerReady = await isDockerAvailable();
      } catch (_) {
        dockerReady = false;
      }

      let cmd, args, processedCode;

      if (language === 'python') {
        processedCode = code; // Python input() reads from stdin natively
        if (dockerReady) {
          cmd = 'docker';
          args = [
            'run', '--rm', '-i',
            '--network', 'none',
            `--memory=${env.DOCKER_MEMORY_LIMIT || '128m'}`,
            `--cpus=${env.DOCKER_CPU_LIMIT || '0.5'}`,
            'python:3.11-alpine',
            'python3', '-u', '-c', processedCode
          ];
        } else {
          cmd = process.platform === 'win32' ? 'python' : 'python3';
          args = ['-u', '-c', processedCode];
        }
      } else {
        // JavaScript
        processedCode = wrapJavaScriptForInteractiveInput(code);
        if (dockerReady) {
          cmd = 'docker';
          args = [
            'run', '--rm', '-i',
            '--network', 'none',
            `--memory=${env.DOCKER_MEMORY_LIMIT || '128m'}`,
            `--cpus=${env.DOCKER_CPU_LIMIT || '0.5'}`,
            'node:18-alpine',
            'node', '-e', processedCode
          ];
        } else {
          cmd = 'node';
          args = ['-e', processedCode];
        }
      }

      // Spawn child process with piped stdin, stdout, stderr
      const child = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_NO_WARNINGS: '1' }
      });

      const timeoutMs = Math.max(env.DOCKER_TIMEOUT_MS || 10000, 30000);
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      // Timeout safety
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL');
        } catch (_) { /* ignore */ }
        socket.emit('exec:output', { text: '\n⏱️ Execution timed out.\n', type: 'error' });
        finishExecution(EXECUTION_STATUS.TIMEOUT, `Execution timed out after ${timeoutMs}ms`);
      }, timeoutMs);

      // Register active execution
      activeExecutions.set(socket.id, { child, timer, execution });

      // Signal to client that process is running
      socket.emit('exec:started', { executionId: execution?._id });

      // Stream stdout to client
      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (stdout.length > 500000) {
          child.kill('SIGKILL');
          return;
        }
        socket.emit('exec:output', { text, type: 'stdout' });
      });

      // Stream stderr to client
      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (stderr.length > 500000) {
          child.kill('SIGKILL');
          return;
        }
        socket.emit('exec:output', { text, type: 'stderr' });
      });

      // Handle spawn error (e.g., python not in PATH)
      child.on('error', (err) => {
        console.error(`[Exec] Process error: ${err.message}`);
        socket.emit('exec:output', { text: `\nExecution error: ${err.message}\n`, type: 'error' });
        finishExecution(EXECUTION_STATUS.FAILED, err.message);
      });

      // Handle process close
      child.on('close', (exitCode) => {
        if (activeExecutions.has(socket.id)) {
          if (exitCode === 0) {
            finishExecution(EXECUTION_STATUS.COMPLETED);
          } else {
            finishExecution(
              EXECUTION_STATUS.FAILED,
              stderr || `Process exited with code ${exitCode}`
            );
          }
        }
      });

      // Finish & save result
      async function finishExecution(status, errorMsg) {
        clearTimeout(timer);
        activeExecutions.delete(socket.id);

        const executionTime = Date.now() - startTime;

        if (execution) {
          try {
            execution.status = status;
            execution.output = stdout;
            execution.error = errorMsg || stderr || '';
            execution.executionTime = executionTime;
            await execution.save();
          } catch (_) { /* ignore DB save failure */ }
        }

        socket.emit('exec:done', {
          executionId: execution?._id,
          status,
          executionTime,
          exitCode: status === EXECUTION_STATUS.COMPLETED ? 0 : 1
        });
      }

    } catch (err) {
      console.error('[Exec] Error starting execution:', err);
      socket.emit('exec:error', { message: `Execution failed: ${err.message}` });
    }
  });

  /**
   * exec:input — Send stdin input to a running execution
   */
  socket.on('exec:input', (data) => {
    const active = activeExecutions.get(socket.id);
    if (!active || !active.child || !active.child.stdin) {
      socket.emit('exec:error', { message: 'No running program to receive input.' });
      return;
    }

    const { text } = data || {};
    if (typeof text !== 'string') return;

    try {
      active.child.stdin.write(text + '\n');
    } catch (err) {
      console.error('[Exec] stdin write error:', err);
    }
  });

  /**
   * exec:stop — Terminate running execution
   */
  socket.on('exec:stop', () => {
    if (activeExecutions.has(socket.id)) {
      killExecution(socket.id);
      socket.emit('exec:done', {
        status: EXECUTION_STATUS.FAILED,
        executionTime: 0,
        exitCode: -1,
        message: 'Execution stopped by user.'
      });
    }
  });

  /**
   * Clean up on disconnect
   */
  socket.on('disconnect', () => {
    killExecution(socket.id);
  });
}

module.exports = { registerExecutionHandlers };
