import { Env } from '../config/env';
import { corsHeaders } from '../middleware/cors';
import { CACHE_TTL_MS } from '../../../shared/constants';
import { TokenRecord, ScanSummary } from '../../../shared/types';
import { ScanTokenRequest } from '../../../shared/contracts';

// Helper to fetch from Firestore REST API
async function getFirestoreDoc(projectId: string, apiKey: string | undefined, collection: string, docId: string, env: Env) {
  let baseUrl = env.FIRESTORE_EMULATOR_HOST 
    ? `http://${env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents`
    : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    
  let url = `${baseUrl}/${collection}/${docId}`;
  if (apiKey) {
    url += `?key=${apiKey}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Firestore read failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Map Firestore document format to our types
function mapFirestoreToToken(doc: any): TokenRecord {
  const fields = doc.fields || {};
  return {
    tokenId: fields.tokenId?.stringValue || '',
    chainId: fields.chainId?.stringValue || '',
    poolAddress: fields.poolAddress?.stringValue || '',
    lastScannedAt: parseInt(fields.lastScannedAt?.integerValue || '0', 10),
    lastScannedBlock: parseInt(fields.lastScannedBlock?.integerValue || '0', 10),
    scanningInProgress: fields.scanningInProgress?.booleanValue || false,
    scanningStartedAt: fields.scanningStartedAt?.integerValue ? parseInt(fields.scanningStartedAt.integerValue, 10) : null,
    createdAt: parseInt(fields.createdAt?.integerValue || '0', 10),
    updatedAt: parseInt(fields.updatedAt?.integerValue || '0', 10),
  };
}

function mapFirestoreToSummary(doc: any): ScanSummary {
  const fields = doc.fields || {};
  return {
    tokenId: fields.tokenId?.stringValue || '',
    totalBuyTokenAmount: parseFloat(fields.totalBuyTokenAmount?.doubleValue || fields.totalBuyTokenAmount?.integerValue || '0'),
    totalSellTokenAmount: parseFloat(fields.totalSellTokenAmount?.doubleValue || fields.totalSellTokenAmount?.integerValue || '0'),
    netFlowTokenAmount: parseFloat(fields.netFlowTokenAmount?.doubleValue || fields.netFlowTokenAmount?.integerValue || '0'),
    totalBuyVolumeUsd: parseFloat(fields.totalBuyVolumeUsd?.doubleValue || fields.totalBuyVolumeUsd?.integerValue || '0'),
    totalSellVolumeUsd: parseFloat(fields.totalSellVolumeUsd?.doubleValue || fields.totalSellVolumeUsd?.integerValue || '0'),
    netFlowUsd: parseFloat(fields.netFlowUsd?.doubleValue || fields.netFlowUsd?.integerValue || '0'),
    buyCount: parseInt(fields.buyCount?.integerValue || '0', 10),
    sellCount: parseInt(fields.sellCount?.integerValue || '0', 10),
    createdAt: parseInt(fields.createdAt?.integerValue || '0', 10),
    updatedAt: parseInt(fields.updatedAt?.integerValue || '0', 10),
  };
}

export const handleApiRequest = async (request: Request, env: Env): Promise<Response> => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = (await request.json()) as ScanTokenRequest;
    
    // Normalize parameters
    const tokenId = body.tokenId.toLowerCase();
    const chainId = body.chainId.toLowerCase();

    // 1. Try to read from Firestore directly (Worker Cache Check)
    if (env.FIRESTORE_PROJECT_ID) {
      try {
        const tokenDoc = await getFirestoreDoc(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY, 'tokens', tokenId, env);
        
        if (tokenDoc) {
          const token = mapFirestoreToToken(tokenDoc);
          const now = Date.now();
          
          if ((now - token.lastScannedAt) < CACHE_TTL_MS) {
            // Cache is fresh, fetch summary and return
            // Note: In real implementation, summary might be inside token doc or separate collection. 
            // Assuming 'summaries' collection here.
            const summaryDoc = await getFirestoreDoc(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY, 'summaries', tokenId, env);
            
            if (summaryDoc) {
              const summary = mapFirestoreToSummary(summaryDoc);
              console.log(`[Worker] Cache hit for ${tokenId}`);
              
              return new Response(JSON.stringify({
                success: true,
                source: 'cache',
                timestamp: now,
                payload: {
                  token,
                  summary
                }
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
              });
            }
          }
        }
      } catch (err) {
        console.error('[Worker] Firestore read error:', err);
        // Fallback to function on error
      }
    }
    
    // 2. Forward to Firebase Cloud Function if no cache hit or cache is stale
    const functionUrl = env.FIREBASE_FUNCTION_URL || 'http://localhost:5001/mock-project/us-central1/scanToken';
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, tokenId, chainId }), // Pass normalized payload
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
