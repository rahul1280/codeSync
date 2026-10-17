# CodeSync Code Execution Sandbox
# Minimal image with JavaScript (Node.js) and Python runtimes
# Runs as non-root user with no network access

FROM node:20-alpine

# Install Python
RUN apk add --no-cache python3

# Create non-root execution user
RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

# Create workspace directory
RUN mkdir -p /workspace && chown sandbox:sandbox /workspace

# Set resource limits via ulimit defaults
# (actual limits enforced by Docker run flags)

# Switch to non-root user
USER sandbox

WORKDIR /workspace

# No CMD - commands are passed at runtime
