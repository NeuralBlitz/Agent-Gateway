# Getting Started

> **Installation, configuration, and first-run guide for Agent Gateway**

This guide walks you through installing Agent Gateway, configuring your first messaging channel and AI provider, and sending your first message end-to-end. Whether you are deploying on a local machine, a VPS, or in a containerized environment, this guide covers all the essential steps.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Connecting Your First Channel](#connecting-your-first-channel)
- [Configuring Your First Provider](#configuring-your-first-provider)
- [Sending Your First Message](#sending-your-first-message)
- [Verifying the Setup](#verifying-the-setup)
- [Next Steps](#next-steps)
- [Common Issues](#common-issues)
- [Support Resources](#support-resources)

---

## Overview

Agent Gateway is a universal AI agent gateway that bridges messaging platforms to AI providers. After completing this guide, you will have:

- A running gateway server accessible on your local network
- At least one messaging channel connected (e.g., Telegram bot)
- At least one AI provider configured (e.g., OpenAI)
- The ability to message your bot and receive AI-generated responses

The entire process takes approximately 10-15 minutes.

---

## Prerequisites

### Software Requirements

| Requirement | Minimum | Recommended | How to Check |
|-------------|---------|-------------|--------------|
| **Node.js** | 20.0.0 | 22.x LTS | `node --version` |
| **npm** | 9.0.0 | 10.x | `npm --version` |
| **Git** | Any | Any | `git --version` |

### Network Requirements

- Outbound HTTPS access (for AI provider APIs)
- Inbound HTTP access on port 3000 (for webhooks, optional for polling)
- If using webhooks: a publicly accessible URL with HTTPS

### Accounts

At least one of each:

| Account Type | Purpose | Where to Get |
|--------------|---------|--------------|
| **Messaging Platform** | Channel for bot communication | Telegram BotFather, Discord Dev Portal, etc. |
| **AI Provider** | AI model for generating responses | OpenAI, Anthropic, Google, etc. |

---

## Installation Methods

### Method 1: npm Install (Recommended for Development)

```bash
# Navigate to the project directory
cd /home/runner/workspace/agent-gateway

# Install dependencies
npm install

# Verify installation
npm run build
```

### Method 2: Docker Compose (Recommended for Production)

```bash
# Navigate to the project directory
cd /home/runner/workspace/agent-gateway

# Start with Docker Compose
docker compose up -d

# Check the container is running
docker compose ps
```

### Method 3: Docker Build

```bash
# Build the image
docker build -t agent-gateway .

# Run the container
docker run -p 3000:3000 \
  -v $(pwd)/agent-gateway.config.json:/app/agent-gateway.config.json \
  -e OPENAI_API_KEY="sk-..." \
  agent-gateway
```

### Method 4: From Source

```bash
# Clone the repository
git clone https://github.com/agent-gateway/agent-gateway.git
cd agent-gateway

# Install dependencies
npm install

# Build
npm run build
```

---

## Quick Start

### Step 1: Initialize the Project

```bash
cd /home/runner/workspace/agent-gateway

# Initialize configuration files
npm start -- init
```

This creates:
- `agent-gateway.config.json` -- Main configuration file
- `.env.example` -- Environment variable template

### Step 2: Configure Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Server
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info

# AI Provider (choose at least one)
OPENAI_API_KEY=sk-your-openai-key
# ANTHROPIC_API_KEY=sk-ant-your-key
# GOOGLE_API_KEY=your-google-key
# MISTRAL_API_KEY=your-mistral-key
# DEEPSEEK_API_KEY=your-deepseek-key

# Channel (choose at least one)
TELEGRAM_TOKEN=your-telegram-bot-token
# DISCORD_TOKEN=your-discord-bot-token
# SLACK_TOKEN=xoxb-your-slack-token
# WHATSAPP_TOKEN=your-whatsapp-token
# WHATSAPP_PHONE_ID=your-phone-id
```

### Step 3: Start the Gateway

```bash
# Development mode (with file watching)
npm run dev

# Or production mode
npm start
```

You should see output like:

```
[info] Agent Gateway starting on 0.0.0.0:3000
[info] Registering built-in channels...
[info] Registering built-in providers...
[info] Channel 'telegram' connected
[info] Provider 'openai' connected
[info] Gateway started successfully
```

---

## Configuration

### Configuration Sources

Configuration is loaded from multiple sources in this order (highest priority first):

1. **Environment variables** -- Override any config value via `process.env`
2. **JSON config file** -- `agent-gateway.config.json`
3. **Defaults** -- Built-in default values

### Configuration File

```jsonc
// /home/runner/workspace/agent-gateway/agent-gateway.config.json
{
  "host": "0.0.0.0",
  "port": 3000,
  "logLevel": "info",
  "channels": {
    "telegram": {
      "token": "${TELEGRAM_TOKEN}"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  },
  "systemPrompt": "You are a helpful assistant.",
  "agent": {
    "maxSteps": 10,
    "contextStrategy": "truncate"
  },
  "sessions": {
    "backend": "file",
    "ttl": 3600
  },
  "auth": {
    "enabled": false
  },
  "rateLimit": {
    "global": { "points": 100, "duration": 60 },
    "perUser": { "points": 20, "duration": 60 }
  },
  "tools": {
    "allowedDirs": ["/home/user/workspace"]
  }
}
```

### Environment Variable Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging verbosity (`trace`/`debug`/`info`/`warn`/`error`) | `info` |
| `SYSTEM_PROMPT` | Default system prompt | `"You are a helpful assistant."` |
| `OPENAI_API_KEY` | OpenAI API key | -- |
| `ANTHROPIC_API_KEY` | Anthropic API key | -- |
| `GOOGLE_API_KEY` | Google/Gemini API key | -- |
| `TELEGRAM_TOKEN` | Telegram Bot token | -- |
| `DISCORD_TOKEN` | Discord Bot token | -- |
| `SLACK_TOKEN` | Slack Bot token | -- |
| `WHATSAPP_TOKEN` | WhatsApp Cloud API token | -- |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID | -- |
| `DISABLE_BASH_TOOL` | Disable the Bash tool | `false` |
| `DISABLE_FS_TOOL` | Disable the Filesystem tool | `false` |
| `DISABLE_WEB_SEARCH` | Disable the Web Search tool | `false` |

---

## Connecting Your First Channel

### Telegram (Easiest Option)

1. **Create a bot**: Message `@BotFather` on Telegram and send `/newbot`
2. **Follow the prompts**: Give your bot a name and username
3. **Copy the token**: BotFather will give you a token like `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`
4. **Add to config**:

```jsonc
{
  "channels": {
    "telegram": {
      "token": "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
    }
  }
}
```

5. **Restart the gateway**: The channel will connect automatically

### Verify Channel Connection

```bash
curl http://localhost:3000/api/status
```

Look for your channel in the `channels` array:

```json
{
  "channels": ["telegram"],
  "providers": ["openai"],
  ...
}
```

---

## Configuring Your First Provider

### OpenAI (Easiest Option)

1. **Get an API key**: Go to [platform.openai.com](https://platform.openai.com) and create an API key
2. **Add to config**:

```jsonc
{
  "providers": {
    "openai": {
      "apiKey": "sk-your-openai-key",
      "model": "gpt-4o"
    }
  }
}
```

3. **Restart the gateway**: The provider will connect automatically

### Available Models

| Provider | Default Model | Alternative Models |
|----------|--------------|-------------------|
| OpenAI | `gpt-4o` | `gpt-4o-mini`, `o1`, `o3-mini` |
| Anthropic | `claude-sonnet-4-20250514` | `claude-opus-4-20250514`, `claude-haiku-4-20250514` |
| Google | `gemini-2.0-flash` | `gemini-2.5-pro` |
| Mistral | `mistral-large-latest` | `mistral-small-latest` |
| DeepSeek | `deepseek-chat` | `deepseek-reasoner` |
| Ollama | `llama3` | Any pulled model |

### Verify Provider Connection

```bash
curl http://localhost:3000/api/status
```

Look for your provider in the `providers` array.

---

## Sending Your First Message

### Via Telegram

1. Open Telegram and search for your bot's username
2. Send `/start` to begin the conversation
3. Type any message, e.g., "Hello! What can you do?"
4. Your bot should respond with an AI-generated response

### Via REST API

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "telegram",
    "chatId": "YOUR_TELEGRAM_CHAT_ID",
    "message": "Hello! What can you do?"
  }'
```

### Via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    channel: 'telegram',
    chatId: 'YOUR_CHAT_ID',
    content: 'Hello!'
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'response') {
    console.log('Bot:', msg.content);
  }
};
```

---

## Verifying the Setup

### Health Check

```bash
curl http://localhost:3000/health
# Expected: {"status": "ok"}
```

### Readiness Check

```bash
curl http://localhost:3000/ready
# Expected: 200 when all channels/providers are connected
```

### Status Check

```bash
curl http://localhost:3000/api/status
# Expected: Lists connected channels and providers
```

### Metrics

```bash
curl http://localhost:3000/metrics
# Expected: Prometheus-formatted metrics
```

### Logs

Check the gateway logs for any errors:

```bash
# Development mode logs are in the terminal
# Production logs depend on your deployment method

# Docker logs
docker compose logs -f agent-gateway
```

---

## Next Steps

After completing this guide, explore these topics:

1. **Multi-channel setup**: Connect additional channels (Discord, Slack, etc.)
2. **Multi-provider setup**: Configure failover and load balancing
3. **Custom tools**: Add custom agent tools
4. **Hooks**: Add custom lifecycle hooks
5. **Plugins**: Build and install custom plugins
6. **Production deployment**: Docker, Kubernetes, monitoring
7. **Security**: Enable authentication, rate limiting, webhook validation

See the [guides documentation](/home/runner/workspace/agent-gateway/docs/guides/README.md) for detailed tutorials.

---

## Common Issues

### "Cannot find module" on Start

Ensure dependencies are installed:

```bash
npm install
npm run build
```

### Port Already in Use

Change the port in your config:

```jsonc
{ "port": 3001 }
```

Or find and kill the process using the port:

```bash
lsof -i :3000
kill <PID>
```

### Channel Not Connecting

1. Verify the token is correct in your config
2. Check `LOG_LEVEL=debug` for detailed connection logs
3. Ensure outbound HTTPS access is available
4. For webhooks: verify the URL is publicly accessible

### Provider Not Connecting

1. Verify the API key is valid and has credits/balance
2. Check for regional restrictions
3. Test the API key directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Messages Not Receiving Responses

1. Verify both channel and provider are connected (`/api/status`)
2. Check the gateway logs for processing errors
3. Ensure the system prompt is valid
4. Verify the session backend is writable

---

## Support Resources

- **Full API documentation**: [docs/api/README.md](/home/runner/workspace/agent-gateway/docs/api/README.md)
- **Architecture overview**: [docs/architecture/README.md](/home/runner/workspace/agent-gateway/docs/architecture/README.md)
- **Channel guides**: [docs/channels/README.md](/home/runner/workspace/agent-gateway/docs/channels/README.md)
- **Provider guides**: [docs/providers/README.md](/home/runner/workspace/agent-gateway/docs/providers/README.md)
- **User guides**: [docs/guides/README.md](/home/runner/workspace/agent-gateway/docs/guides/README.md)
- **Source code**: `/home/runner/workspace/agent-gateway/src/`
- **Test suite**: `/home/runner/workspace/agent-gateway/test/`
- **Main README**: `/home/runner/workspace/agent-gateway/README.md`
