# CodeSync Code Execution Service

## Overview

The execution service provides sandboxed code execution using Docker containers. User-submitted code runs inside isolated containers with strict resource limits.

## Supported Languages

| Language   | Runtime      | Status     |
|-----------|-------------|------------|
| JavaScript | Node.js 20  | ✅ Ready   |
| Python     | Python 3    | ✅ Ready   |
| Java       | —           | 🔮 Planned |
| C++        | —           | 🔮 Planned |

## Building the Sandbox Image

```bash
cd execution
docker build -t codesync-sandbox .
```

## Security Measures

The execution containers are configured with these security constraints:

| Constraint          | Setting                    |
|--------------------|-----------------------------|
| User               | Non-root (`sandbox`)        |
| Network            | Disabled (`--network none`) |
| Filesystem         | Read-only (`--read-only`)   |
| Memory limit       | 128MB                       |
| CPU limit          | 0.5 cores                   |
| Process limit      | 64 (`--pids-limit`)         |
| Execution timeout  | 10 seconds                  |
| Output limit       | 1MB                         |
| Temp filesystem    | 64MB tmpfs at /tmp          |

## How It Works

1. The backend receives a code execution request via `POST /api/execute`
2. The code is written to a temporary file on the host
3. A Docker container is started with the sandbox image
4. The temp file is mounted read-only into the container
5. The code runs with timeout and resource constraints
6. stdout and stderr are captured and returned
7. The container and temp files are cleaned up

## Environment Variables

```
DOCKER_ENABLED=true                    # Enable/disable execution
EXECUTION_TIMEOUT=10000                # Timeout in ms
EXECUTION_MEMORY_LIMIT=134217728       # 128MB in bytes
EXECUTION_CPU_LIMIT=0.5                # CPU cores
```

## Testing

```bash
# Test JavaScript execution
docker run --rm --network none --read-only --memory=128m --cpus=0.5 \
  --tmpfs /tmp:size=64m codesync-sandbox \
  node -e "console.log('Hello from sandbox!')"

# Test Python execution
docker run --rm --network none --read-only --memory=128m --cpus=0.5 \
  --tmpfs /tmp:size=64m codesync-sandbox \
  python3 -c "print('Hello from sandbox!')"
```

## Security Notes

- **Never** mount the Docker socket into execution containers
- **Never** run containers with `--privileged`
- **Never** pass application environment variables to execution containers
- The host temporary directory is cleaned up after each execution
- Container names include a unique ID for tracking
