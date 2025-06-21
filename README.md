# Dynamic Link QR Generator - Detailed Usage Documentation

## Table of Contents
1. [Installation](#installation)
2. [Basic Concepts](#basic-concepts)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Integration Guides](#integration-guides)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Installation

```bash
npm install dynamic-link-qr-generator
```

### Requirements
- Node.js 12.0 or higher
- npm or yarn

### Dependencies
The package automatically installs:
- `qrcode` - For QR code generation
- `uuid` - For unique identifier generation

## Basic Concepts

### What it does
The package takes your API endpoint and:
1. Adds a timestamp (milliseconds since epoch)
2. Adds a UUID (universally unique identifier)
3. Generates a QR code from the modified link
4. Returns it as a base64 data URL string
5. Regenerates every 30 seconds automatically

### Example transformation
```
Input:  https://api.example.com/endpoint
Output: https://api.example.com/endpoint?timestamp=1703001234567&uuid=550e8400-e29b-41d4-a716-446655440000
Result: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAAC..."
```

## Quick Start

### Minimal Example
```javascript
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

// Create instance
const qr = new DynamicLinkQRGenerator('https://api.example.com/endpoint');

// Start generation
qr.start();

// Get QR code string
const qrString = qr.getCurrent();
console.log(qrString); // "data:image/png;base64,..."
```

## API Reference

### Class: `DynamicLinkQRGenerator`

#### Constructor
```javascript
new DynamicLinkQRGenerator(apiLink)
```

**Parameters:**
- `apiLink` (string, required) - The base API endpoint URL

**Throws:**
- `Error` if apiLink is not provided

**Example:**
```javascript
const qr = new DynamicLinkQRGenerator('https://api.myservice.com/data');
```

#### Methods

##### `start()`
Starts automatic QR code regeneration every 30 seconds.

```javascript
qr.start();
```

- Generates QR code immediately upon calling
- Sets up 30-second interval for regeneration
- Safe to call multiple times (restarts the timer)

##### `stop()`
Stops automatic regeneration.

```javascript
qr.stop();
```

- Clears the regeneration timer
- Keeps the last generated QR code available

##### `getCurrent()`
Returns the current QR code as a data URL string.

```javascript
const qrString = qr.getCurrent();
```

**Returns:**
- `string` - Base64 data URL of the QR code
- `null` - If no QR code has been generated yet

**Return format:**
```
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAAC..."
```

##### `generate()`
Manually generates a new QR code.

```javascript
const qrString = await qr.generate();
```

**Returns:**
- `Promise<string>` - Promise that resolves to the data URL string

**Note:** This is called automatically by `start()`, but you can use it for manual generation.

##### `destroy()`
Cleans up all resources.

```javascript
qr.destroy();
```

- Stops the timer
- Clears stored QR code
- Should be called when you're done with the instance

### Static Methods

#### `DynamicLinkQRGenerator.generateOnce(apiLink)`
Generates a single QR code without creating an instance.

```javascript
const qrString = await DynamicLinkQRGenerator.generateOnce('https://api.example.com/endpoint');
```

**Parameters:**
- `apiLink` (string, required) - The API endpoint URL

**Returns:**
- `Promise<string>` - Promise that resolves to the data URL string

**Use when:**
- You need a one-time QR code
- You don't need automatic regeneration

## Usage Examples

### Basic API Integration
```javascript
const express = require('express');
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

const app = express();

// Initialize on server start
const qrGenerator = new DynamicLinkQRGenerator('https://api.myservice.com/protected');
qrGenerator.start();

// API endpoint
app.get('/api/qr-code', (req, res) => {
  const qrCode = qrGenerator.getCurrent();
  
  if (qrCode) {
    res.json({ 
      success: true,
      qrCode: qrCode,
      type: 'string',
      format: 'data-url'
    });
  } else {
    // This rarely happens - only in the milliseconds before first generation
    res.status(503).json({ 
      success: false,
      message: 'QR code generation in progress' 
    });
  }
});

app.listen(3000);
```

### One-Time Generation
```javascript
app.get('/api/generate-qr', async (req, res) => {
  try {
    const { apiUrl } = req.query;
    
    if (!apiUrl) {
      return res.status(400).json({ error: 'API URL required' });
    }
    
    const qrCode = await DynamicLinkQRGenerator.generateOnce(apiUrl);
    
    res.json({
      success: true,
      qrCode: qrCode
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
```

### Multiple Instances
```javascript
// Managing multiple QR generators for different endpoints
const generators = {
  auth: new DynamicLinkQRGenerator('https://api.example.com/auth'),
  data: new DynamicLinkQRGenerator('https://api.example.com/data'),
  webhook: new DynamicLinkQRGenerator('https://api.example.com/webhook')
};

// Start all generators
Object.values(generators).forEach(gen => gen.start());

// Endpoint to get all QR codes
app.get('/api/all-qr-codes', (req, res) => {
  const qrCodes = {};
  
  for (const [name, generator] of Object.entries(generators)) {
    qrCodes[name] = generator.getCurrent();
  }
  
  res.json(qrCodes);
});
```

### Manual Regeneration Control
```javascript
const qr = new DynamicLinkQRGenerator('https://api.example.com/endpoint');

// Don't start automatic regeneration
// Generate only when needed
app.post('/api/regenerate-qr', async (req, res) => {
  try {
    const newQr = await qr.generate();
    res.json({ 
      success: true,
      qrCode: newQr 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
```

## Integration Guides

### Express.js Full Example
```javascript
const express = require('express');
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

const app = express();
const port = 3000;

// Create QR generator
const qrGenerator = new DynamicLinkQRGenerator('https://api.myservice.com/v1/verify');

// Start generation when server starts
qrGenerator.start();

// Middleware to ensure QR is available
const ensureQR = (req, res, next) => {
  if (!qrGenerator.getCurrent()) {
    return res.status(503).json({ error: 'Service starting up' });
  }
  next();
};

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/qr-code', ensureQR, (req, res) => {
  res.json({
    qrCode: qrGenerator.getCurrent(),
    generatedAt: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  qrGenerator.destroy();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Next.js API Route
```javascript
// pages/api/qr-code.js
import DynamicLinkQRGenerator from 'dynamic-link-qr-generator';

// Create singleton instance
let qrGenerator;

function getGenerator() {
  if (!qrGenerator) {
    qrGenerator = new DynamicLinkQRGenerator(process.env.API_ENDPOINT);
    qrGenerator.start();
  }
  return qrGenerator;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const generator = getGenerator();
  const qrCode = generator.getCurrent();
  
  res.status(200).json({ qrCode });
}
```

### Fastify Example
```javascript
const fastify = require('fastify')();
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

const qrGenerator = new DynamicLinkQRGenerator('https://api.example.com/endpoint');

fastify.addHook('onReady', async () => {
  qrGenerator.start();
});

fastify.get('/api/qr-code', async (request, reply) => {
  return {
    qrCode: qrGenerator.getCurrent()
  };
});

fastify.addHook('onClose', async () => {
  qrGenerator.destroy();
});

fastify.listen({ port: 3000 });
```

### NestJS Service Example
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

@Injectable()
export class QRService implements OnModuleInit, OnModuleDestroy {
  private qrGenerator;

  onModuleInit() {
    this.qrGenerator = new DynamicLinkQRGenerator(process.env.API_ENDPOINT);
    this.qrGenerator.start();
  }

  onModuleDestroy() {
    this.qrGenerator.destroy();
  }

  getCurrentQR(): string | null {
    return this.qrGenerator.getCurrent();
  }

  async regenerate(): Promise<string> {
    return await this.qrGenerator.generate();
  }
}
```

## Common Patterns

### Using the QR Code String

#### In JSON Response
```javascript
app.get('/api/qr', (req, res) => {
  res.json({
    qrCode: qr.getCurrent() // String in response
  });
});
```

#### As HTML Image
```javascript
app.get('/qr-image', (req, res) => {
  const qrCode = qr.getCurrent();
  res.send(`
    <html>
      <body>
        <img src="${qrCode}" alt="QR Code" />
      </body>
    </html>
  `);
});
```

#### Store in Database
```javascript
const qrCode = qr.getCurrent();

// MongoDB
await db.collection('qrcodes').insertOne({
  code: qrCode, // Store as string
  createdAt: new Date()
});

// PostgreSQL
await db.query(
  'INSERT INTO qr_codes (code, created_at) VALUES ($1, $2)',
  [qrCode, new Date()]
);
```

#### Send via WebSocket
```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Send QR updates to all connected clients
setInterval(() => {
  const qrCode = qr.getCurrent();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ qrCode }));
    }
  });
}, 30000);
```

### Error Handling
```javascript
// Wrap in try-catch for production
app.get('/api/qr-code', async (req, res) => {
  try {
    const qrCode = qr.getCurrent();
    
    if (!qrCode) {
      // Manually generate if needed
      await qr.generate();
      const newQr = qr.getCurrent();
      return res.json({ qrCode: newQr });
    }
    
    res.json({ qrCode });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate QR code' 
    });
  }
});
```

## Troubleshooting

### QR Code is `null`
```javascript
// Problem: getCurrent() returns null
const qr = new DynamicLinkQRGenerator('https://api.example.com');
console.log(qr.getCurrent()); // null

// Solution: Start the generator or wait for first generation
qr.start();
setTimeout(() => {
  console.log(qr.getCurrent()); // Now returns string
}, 100);
```

### Memory Leaks
```javascript
// Problem: Creating multiple instances without cleanup
app.get('/generate', (req, res) => {
  const qr = new DynamicLinkQRGenerator(req.query.url); // DON'T DO THIS
  qr.start();
  res.json({ qr: qr.getCurrent() });
});

// Solution: Reuse instances or properly cleanup
const generators = new Map();

app.get('/generate', (req, res) => {
  const { url } = req.query;
  
  if (!generators.has(url)) {
    const qr = new DynamicLinkQRGenerator(url);
    qr.start();
    generators.set(url, qr);
  }
  
  res.json({ qr: generators.get(url).getCurrent() });
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  generators.forEach(qr => qr.destroy());
});
```

### Invalid URL Errors
```javascript
// Handle invalid URLs gracefully
try {
  const qr = new DynamicLinkQRGenerator('not-a-valid-url'); // Throws error
} catch (error) {
  console.error('Invalid URL:', error.message);
}

// Validate before creating
function createQRGenerator(url) {
  try {
    new URL(url); // Validate URL
    return new DynamicLinkQRGenerator(url);
  } catch {
    throw new Error('Invalid URL provided');
  }
}
```

## Best Practices

### 1. Single Instance Pattern
```javascript
// Create once, use everywhere
class QRManager {
  constructor() {
    this.generators = new Map();
  }
  
  getGenerator(url) {
    if (!this.generators.has(url)) {
      const qr = new DynamicLinkQRGenerator(url);
      qr.start();
      this.generators.set(url, qr);
    }
    return this.generators.get(url);
  }
  
  destroyAll() {
    this.generators.forEach(qr => qr.destroy());
    this.generators.clear();
  }
}

const qrManager = new QRManager();
module.exports = qrManager;
```

### 2. Environment Configuration
```javascript
// Use environment variables
const QR_API_ENDPOINT = process.env.QR_API_ENDPOINT || 'https://api.example.com/default';
const qr = new DynamicLinkQRGenerator(QR_API_ENDPOINT);
```

### 3. Health Checks
```javascript
app.get('/health', (req, res) => {
  const qrStatus = qr.getCurrent() ? 'healthy' : 'initializing';
  res.json({
    status: 'ok',
    qrGenerator: qrStatus,
    uptime: process.uptime()
  });
});
```

### 4. Logging
```javascript
const qr = new DynamicLinkQRGenerator('https://api.example.com/endpoint');

// Log generation events
const originalGenerate = qr.generate.bind(qr);
qr.generate = async function() {
  console.log(`[${new Date().toISOString()}] Generating new QR code`);
  const result = await originalGenerate();
  console.log(`[${new Date().toISOString()}] QR code generated successfully`);
  return result;
};
```

### 5. Monitoring
```javascript
// Track QR generation metrics
let generationCount = 0;
let lastGenerationTime = null;

const originalGenerate = qr.generate.bind(qr);
qr.generate = async function() {
  const start = Date.now();
  const result = await originalGenerate();
  
  generationCount++;
  lastGenerationTime = Date.now() - start;
  
  return result;
};

app.get('/metrics', (req, res) => {
  res.json({
    qrGenerations: generationCount,
    lastGenerationMs: lastGenerationTime
  });
});
```

## Complete Working Example

```javascript
// server.js
const express = require('express');
const DynamicLinkQRGenerator = require('dynamic-link-qr-generator');

const app = express();
const port = process.env.PORT || 3000;

// Configuration
const API_ENDPOINT = process.env.API_ENDPOINT || 'https://api.example.com/verify';

// Create and start QR generator
console.log(`Initializing QR generator for: ${API_ENDPOINT}`);
const qrGenerator = new DynamicLinkQRGenerator(API_ENDPOINT);
qrGenerator.start();

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'QR Code Generator API',
    endpoints: {
      'GET /api/qr-code': 'Get current QR code',
      'POST /api/regenerate': 'Force regenerate QR code',
      'GET /health': 'Health check'
    }
  });
});

app.get('/api/qr-code', (req, res) => {
  const qrCode = qrGenerator.getCurrent();
  
  res.json({
    success: true,
    data: {
      qrCode: qrCode,
      format: 'data-url',
      encoding: 'base64',
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/regenerate', async (req, res) => {
  try {
    const newQr = await qrGenerator.generate();
    res.json({
      success: true,
      message: 'QR code regenerated',
      data: {
        qrCode: newQr
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  const hasQr = qrGenerator.getCurrent() !== null;
  res.json({
    status: hasQr ? 'healthy' : 'initializing',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    qrAvailable: hasQr
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log('QR generator started - regenerating every 30 seconds');
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    qrGenerator.destroy();
    console.log('QR generator destroyed');
    
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Summary

The Dynamic Link QR Generator provides:
- ✅ Automatic QR generation every 30 seconds
- ✅ Timestamp and UUID added to every link
- ✅ Simple string-based data URL output
- ✅ Easy integration with any Node.js framework
- ✅ Minimal configuration required
- ✅ Production-ready with proper cleanup

Perfect for APIs that need rotating QR codes with unique identifiers!