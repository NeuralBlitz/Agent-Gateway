# User Guides and Tutorials

> **Step-by-step tutorials, how-tos, and best practices for Agent Gateway**

This directory contains practical guides for common tasks with Agent Gateway. Each guide is self-contained and assumes you have completed the [Getting Started guide](/home/runner/workspace/agent-gateway/docs/getting-started/README.md). Guides range from basic configuration tasks to advanced production deployment patterns.

---

## Table of Contents

- [Overview](#overview)
- [Beginner Guides](#beginner-guides)
- [Intermediate Guides](#intermediate-guides)
- [Advanced Guides](#advanced-guides)
- [Production Guides](#production-guides)
- [Development Guides](#development-guides)
- [Troubleshooting Guides](#troubleshooting-guides)
- [Best Practices](#best-practices)
- [Guide Template](#guide-template)

---

## Overview

The guides in this section are organized by complexity level. Each guide includes:

- A clear objective and prerequisites
- Step-by-step instructions with code examples
- Expected outcomes and verification steps
- Troubleshooting tips for common issues
- Links to related documentation

### How to Use This Documentation

1. **Find your level**: Start with Beginner if you are new to Agent Gateway
2. **Follow sequentially**: Some guides build on concepts from earlier guides
3. **Reference as needed**: Each guide is self-contained and can be read independently
4. **Contribute**: Add new guides for tasks you discover

---

## Beginner Guides

### Creating Your First Bot

**Time**: 10 minutes  
**Prerequisites**: Agent Gateway running, Telegram bot token, OpenAI API key

This guide walks through the complete flow of creating a Telegram bot and connecting it to an AI provider for intelligent responses.

**Steps**:
1. Create a bot via Telegram BotFather
2. Configure the channel in `agent-gateway.config.json`
3. Set your OpenAI API key
4. Start the gateway
5. Message your bot and verify the response

**Verification**: Send "Hello" to your bot and receive a contextual AI response.

---

### Setting Up Multi-Channel Support

**Time**: 15 minutes  
**Prerequisites**: Working single-channel setup, additional channel tokens

Connect multiple messaging platforms to the same gateway instance for unified bot access.

**Supported Combinations**:
- Telegram + Discord
- Telegram + Slack
- All six channels simultaneously

**Key Concept**: The gateway routes messages from all channels through the same agent pipeline, maintaining separate sessions per channel+user combination.

---

### Configuring Custom System Prompts

**Time**: 5 minutes  
**Prerequisites**: Running gateway

Customize the AI personality and behavior via the system prompt:

```jsonc
{
  "systemPrompt": "You are a friendly customer support assistant for Acme Corp. Be concise, professional, and helpful. You can help with: order status, product information, and technical support."
}
```

**Tips**:
- Be specific about the assistant's role and limitations
- Include response style guidelines
- Mention available tools and when to use them
- Test with various prompts to verify behavior

---

### Disabling Built-in Tools

**Time**: 2 minutes  
**Prerequisites**: Running gateway

Disable tools you do not want the AI to access:

```bash
# Disable the Bash tool
export DISABLE_BASH_TOOL=true

# Disable the Filesystem tool
export DISABLE_FS_TOOL=true

# Disable the Web Search tool
export DISABLE_WEB_SEARCH=true
```

Or in config:

```jsonc
{
  "tools": {
    "disableBash": true,
    "disableFilesystem": true,
    "disableWebSearch": true
  }
}
```

---

## Intermediate Guides

### Writing Custom Hooks

**Time**: 30 minutes  
**Prerequisites**: Understanding of the hook system architecture

Custom hooks allow you to inject logic at any point in the message processing pipeline.

**Hook Phases**:

| Phase | Purpose | Use Case |
|-------|---------|----------|
| `beforeMessage` | After message received | Input validation, enrichment, rejection |
| `beforeAgent` | Before agent processing | Context modification, provider selection |
| `afterAgent` | After agent processing | Response transformation |
| `afterResponse` | Before sending response | Logging, formatting, notification |
| `onError` | On any error | Error handling, alerting, fallback |

**Creating a Hook**:

```typescript
import { createHook, registerGlobalHook } from '/home/runner/workspace/agent-gateway/src/hooks/index.js';

const myHook = createHook(
  'my-custom-hook',          // Unique name
  'beforeMessage',            // Phase
  async (ctx) => {           // Handler
    console.log('Received message:', ctx.message?.content);
    // Modify context, throw to reject, or return normally
  },
  5                          // Priority (higher = first)
);

registerGlobalHook(myHook);
```

**Example -- Message Logging Hook**:

```typescript
const logger = createHook(
  'message-logger',
  'beforeMessage',
  async (ctx) => {
    const msg = ctx.message;
    console.log(`[${msg?.channel}] ${msg?.userId}: ${msg?.content}`);
  },
  1
);
```

**Example -- Profanity Filter**:

```typescript
const profanityFilter = createHook(
  'profanity-filter',
  'beforeMessage',
  async (ctx) => {
    const badWords = ['bad1', 'bad2'];
    if (badWords.some(w => ctx.message?.content?.includes(w))) {
      throw new Error('Message contains inappropriate content');
    }
  },
  10
);
```

---

### Building Custom Tools

**Time**: 45 minutes  
**Prerequisites**: Understanding of the tool registry

Custom tools extend the AI agent's capabilities beyond the built-in Bash, Filesystem, and Web Search tools.

**Tool Definition Structure**:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute(args: Record<string, any>): Promise<string>;
}
```

**Example -- Weather Tool**:

```typescript
const weatherTool: Tool = {
  name: 'getWeather',
  description: 'Get current weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
      },
    },
    required: ['city'],
  },
  async execute(args) {
    const response = await fetch(
      `https://api.weather.com/v1/${args.city}?unit=${args.unit || 'celsius'}`
    );
    const data = await response.json();
    return `${data.temperature}${args.unit === 'celsius' ? 'C' : 'F'}, ${data.condition}`;
  },
};

// Register with the tool registry
const registry = createToolRegistry();
registry.register(weatherTool);
```

---

### Configuring Session Persistence

**Time**: 15 minutes  
**Prerequisites**: Understanding of session management

Choose the right session backend for your deployment:

**File Backend** (default, development):

```jsonc
{
  "sessions": {
    "backend": "file",
    "directory": "/path/to/sessions"
  }
}
```

**Database Backend** (single instance, production):

```jsonc
{
  "sessions": {
    "backend": "database",
    "url": "file://sessions.db"
  }
}
```

**Redis Backend** (distributed, high-throughput):

```jsonc
{
  "sessions": {
    "backend": "redis",
    "url": "redis://localhost:6379"
  }
}
```

---

## Advanced Guides

### Multi-Provider Failover Configuration

**Time**: 20 minutes  
**Prerequisites**: Multiple provider API keys

Configure automatic failover between AI providers for maximum availability:

```typescript
import { FailoverProvider, createFailoverProvider }
  from '/home/runner/workspace/agent-gateway/src/failover/index.js';

const failover = createFailoverProvider({
  primary: openaiProvider,
  fallbacks: [anthropicProvider, googleProvider],
  fallbackOn: ['rate_limit', 'timeout', 'error'],
});
```

**Behavior**:
1. Request goes to primary provider
2. If primary fails (rate limit, timeout, error), try first fallback
3. Continue through fallbacks until one succeeds
4. If all fail, return error to user

---

### Load Balancing Across Providers

**Time**: 20 minutes  
**Prerequisites**: Multiple instances of the same provider

Distribute requests across multiple provider instances:

```typescript
import { LoadBalancerProvider, createLoadBalancerProvider }
  from '/home/runner/workspace/agent-gateway/src/failover/index.js';

const lb = createLoadBalancerProvider({
  providers: [openai1, openai2, openai3],
  strategy: 'round-robin', // or 'least-loaded'
});
```

**Strategies**:
- **Round-robin**: Distribute evenly across all providers
- **Least-loaded**: Send to provider with fewest active requests

---

### Building Custom Channel Adapters

**Time**: 2 hours  
**Prerequisites**: TypeScript knowledge, platform API documentation

Create a channel adapter for an unsupported messaging platform:

1. **Extend `BaseChannel`** from the Plugin SDK
2. **Implement the `Channel` interface**: connect, disconnect, sendMessage, getUser, getMe, on
3. **Handle inbound messages**: Parse platform format, emit normalized `ChannelMessage`
4. **Handle outbound messages**: Format internal messages for platform rendering
5. **Package as a plugin**: Create manifest, publish to npm
6. **Install and configure**: Add to gateway config

See the [Channel documentation](/home/runner/workspace/agent-gateway/docs/channels/README.md) for the full interface specification.

---

### Building Custom Provider Adapters

**Time**: 2 hours  
**Prerequisites**: TypeScript knowledge, provider API documentation

Create a provider adapter for an unsupported AI model:

1. **Extend `BaseProvider`** from the Plugin SDK
2. **Implement the `Provider` interface**: connect, disconnect, chat, chatWithTools
3. **Handle tool-calling**: Parse provider-specific tool format, execute tools
4. **Handle streaming**: Parse streaming response format
5. **Package as a plugin**: Create manifest, publish to npm
6. **Install and configure**: Add to gateway config

See the [Provider documentation](/home/runner/workspace/agent-gateway/docs/providers/README.md) for the full interface specification.

---

## Production Guides

### Docker Deployment

**Time**: 15 minutes  
**Prerequisites**: Docker and Docker Compose installed

Use the included `docker-compose.yml`:

```yaml
# /home/runner/workspace/agent-gateway/docker-compose.yml
services:
  agent-gateway:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./agent-gateway.config.json:/app/agent-gateway.config.json
      - agent-sessions:/app/sessions
    env_file:
      - .env
    restart: unless-stopped

volumes:
  agent-sessions:
```

Start:

```bash
docker compose up -d
docker compose logs -f
```

---

### Kubernetes Deployment

**Time**: 30 minutes  
**Prerequisites**: Kubernetes cluster, kubectl configured

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-gateway
  template:
    metadata:
      labels:
        app: agent-gateway
    spec:
      containers:
        - name: agent-gateway
          image: agent-gateway:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: agent-gateway-secrets
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: agent-gateway
spec:
  selector:
    app: agent-gateway
  ports:
    - port: 3000
      targetPort: 3000
  type: LoadBalancer
```

---

### Monitoring and Alerting

**Time**: 30 minutes  
**Prerequisites**: Prometheus and Grafana installed

**Prometheus Configuration**:

```yaml
scrape_configs:
  - job_name: 'agent-gateway'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

**Key Alerts**:

| Alert | Condition | Action |
|-------|-----------|--------|
| Gateway Down | `up{job="agent-gateway"} == 0` for 1m | Page on-call |
| High Error Rate | `rate(errors_total[5m]) > 1` for 5m | Investigate logs |
| High Latency | `histogram_quantile(0.99, http_request_duration) > 10` | Check provider health |
| No Sessions | `active_sessions == 0` for 30m | Check channel connections |
| Cache Hit Rate Low | `cache_hits / (cache_hits + cache_misses) < 0.5` | Review cache config |

---

## Development Guides

### Running the Test Suite

```bash
cd /home/runner/workspace/agent-gateway

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run e2e tests only
npm run test:e2e

# Run specific test file
npm run test -- gateway.test.ts
```

### Adding a New Test

Create a file in `/home/runner/workspace/agent-gateway/test/`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createGateway } from '../src/gateway/index.js';

describe('MyFeature', () => {
  let gw: ReturnType<typeof createGateway>;

  beforeEach(() => {
    gw = createGateway({ host: '0.0.0.0', port: 0 });
  });

  it('should do something', async () => {
    await gw.start();
    expect(gw.isHealthy()).toBe(true);
    await gw.stop();
  });
});
```

### Debugging

Set `LOG_LEVEL=debug` for verbose logging:

```bash
LOG_LEVEL=debug npm run dev
```

---

## Troubleshooting Guides

### "Channel Not Connected" After Start

**Symptoms**: `GET /api/status` shows channel as disconnected  
**Causes**: Invalid token, network issue, webhook failure  
**Resolution**:

1. Check `LOG_LEVEL=debug` logs for connection errors
2. Verify the token in your config matches the platform dashboard
3. For webhooks: verify the URL is publicly accessible with valid TLS
4. Test network connectivity: `curl https://api.telegram.org/bot<TOKEN>/getMe`

### "Provider Error" on Message Send

**Symptoms**: API returns 500 with `PROVIDER_ERROR`  
**Causes**: Invalid API key, rate limit exceeded, model unavailable  
**Resolution**:

1. Verify the API key is valid: `curl -H "Authorization: Bearer $KEY" https://api.openai.com/v1/models`
2. Check your account balance/credits
3. Try a different model
4. Configure a failover provider

### High Memory Usage

**Symptoms**: Process memory grows over time  
**Causes**: In-memory sessions, unclosed connections, memory leak  
**Resolution**:

1. Switch to File, Database, or Redis session backend
2. Configure session TTL to expire old sessions
3. Check for unclosed connections in channel adapters
4. Monitor with `GET /api/status` for session count

---

## Best Practices

### Security

1. **Never commit API keys**: Use environment variables or secret management
2. **Enable authentication**: Always enable auth for production deployments
3. **Restrict allowed directories**: Limit tool access to specific directories
4. **Use webhooks over polling**: Polling exposes your bot token in outbound requests
5. **Rotate tokens regularly**: Especially for production deployments

### Performance

1. **Use response caching**: Reduce redundant API calls
2. **Configure session TTL**: Prevent session store from growing indefinitely
3. **Monitor Prometheus metrics**: Set up alerts for anomalies
4. **Use the right session backend**: File for dev, Database/Redis for production

### Reliability

1. **Configure failover providers**: Automatic fallback when primary fails
2. **Set appropriate timeouts**: Both per-step and workflow-level
3. **Enable rate limiting**: Protect against abuse and API limit exhaustion
4. **Use health checks**: Kubernetes liveness and readiness probes

### Development

1. **Use `npm run dev`**: Hot reload during development
2. **Write tests first**: Test-driven development for new features
3. **Use TypeScript strict mode**: Catch type errors at compile time
4. **Document as you go**: Update docs alongside code changes

---

## Guide Template

When adding new guides, follow this template:

```markdown
# Guide Title

> One-sentence summary

**Time**: X minutes  
**Prerequisites**: List of prerequisites

## Objective

What this guide accomplishes.

## Steps

### Step 1: Description

Code examples and explanations.

### Step 2: Description

More code examples.

## Verification

How to verify the setup works.

## Troubleshooting

Common issues and solutions.

## See Also

Links to related documentation.
```
