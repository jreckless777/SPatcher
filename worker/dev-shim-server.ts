import express from 'express';
import { handleApiRequest } from './src/handlers/apiHandler';
import { Env } from './src/config/env';

/**
 * Cloudflare Worker Local Dev-Only Shim Server
 * 
 * NOTE: This shim is ONLY created for local development and testing in the AI Studio sandbox
 * because wrangler dev (Miniflare/workerd) hits environment sandbox restrictions (spawn EFAULT).
 * For production deployment, you must still use `wrangler deploy` to deploy the real Worker
 * code directly to Cloudflare.
 */

const app = express();
app.use(express.json());

// Set up the development env based on wrangler.toml and local environment
const env: Env = {
  FIREBASE_FUNCTION_URL: process.env.FIREBASE_FUNCTION_URL || 'http://127.0.0.1:5001/mock-project/us-central1/scanToken',
  FIRESTORE_PROJECT_ID: process.env.FIRESTORE_PROJECT_ID || 'mock-project',
  FIRESTORE_API_KEY: process.env.FIRESTORE_API_KEY || '',
  FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081',
};

// Log initialization info
console.log('[Worker Shim] Starting dev-shim-server with environment:', env);

// CORS headers configuration for raw requests if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.all('*', async (req, res) => {
  try {
    const url = `http://${req.headers.host || 'localhost'}${req.url}`;
    
    // Construct Standard Web Request expected by handleApiRequest
    const webReq = new Request(url, {
      method: req.method,
      headers: req.headers as any,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    console.log(`[Worker Shim] Incoming request ${req.method} ${req.url}`);
    const webRes = await handleApiRequest(webReq, env);

    // Copy status
    res.status(webRes.status);

    // Copy headers from standard Web Response to Express ServerResponse
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Copy body
    const bodyText = await webRes.text();
    res.send(bodyText);
  } catch (err: any) {
    console.error('[Worker Shim] Error forwarding request:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 8787;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Worker Shim] Local dev worker shim running on http://localhost:${PORT}`);
});
