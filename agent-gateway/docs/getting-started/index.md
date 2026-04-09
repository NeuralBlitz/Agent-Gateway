# Getting Started

Welcome to Agent Gateway! This guide will help you set up your first AI gateway in minutes.

## Prerequisites

- Node.js 20.0.0 or higher
- npm, yarn, or pnpm

## Installation

```bash
npm install agent-gateway
```

## Step 1: Initialize Project

Create a new directory and initialize Agent Gateway:

```bash
mkdir my-gateway && cd my-gateway
npx agent-gateway init
```

This creates:
- `agent-gateway.config.json` - Main configuration file

## Step 2: Configure Your Gateway

Edit `agent-gateway.config.json` to add your channels and providers.

### Example: Telegram + OpenAI

```json
{
  "version": "1.0.0",
  "gateway": {
    "host": "0.0.0.0",
    "port": 3000
  },
  "channels": [
    {
      "type": "telegram",
      "name": "main-bot",
      "enabled": true,
      "settings": {
        "botToken": "YOUR_TELEGRAM_BOT_TOKEN"
      }
    }
  ],
  "providers": [
    {
      "type": "openai",
      "name": "gpt-4",
      "enabled": true,
      "settings": {
        "apiKey": "YOUR_OPENAI_API_KEY",
        "model": "gpt-4o"
      }
    }
  ],
  "autoReply": {
    "enabled": true,
    "provider": "gpt-4",
    "systemPrompt": "You are a helpful AI assistant. Keep responses concise."
  }
}
```

## Step 3: Get Your API Keys

### Telegram Bot Token

1. Open Telegram and search for @BotFather
2. Send `/newbot` to create a new bot
3. Copy the bot token

### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key

## Step 4: Start the Server

```bash
npx agent-gateway server
```

You should see:
```
Agent Gateway v1.0.0
Starting gateway on 0.0.0.0:3000
Gateway server running...
```

## Step 5: Test Your Bot

1. Open Telegram and find your bot
2. Send a message
3. You should receive an AI response!

## Next Steps

- [Configuration Guide](configuration.md) - Full configuration options
- [Channels](channels/overview.md) - Learn about channel integrations
- [Providers](providers/overview.md) - Explore AI providers
- [API Reference](api/overview.md) - Programmatic usage

## Troubleshooting

### Bot not responding?

1. Check your bot token is correct
2. Verify the API key is valid
3. Check logs for errors

### Rate limiting?

Add rate limiting to your config:

```json
{
  "rateLimit": {
    "global": {
      "points": 60,
      "duration": 60
    }
  }
}
```

### Need help?

- GitHub Issues: https://github.com/agent-gateway/agent-gateway/issues
- Check the full documentation at [docs/](api/overview.md)