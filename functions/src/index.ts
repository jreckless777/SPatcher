import { onRequest } from 'firebase-functions/v2/https';
import { handleScanRequest } from './handlers/scanHandler';

// Export as Firebase Cloud Function using v2 API
export const scanToken = onRequest({ cors: true, maxInstances: 10, timeoutSeconds: 120 }, async (req, res) => {
  try {
    const response = await handleScanRequest(req.body);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
