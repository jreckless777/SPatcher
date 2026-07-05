"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const scanHandler_1 = require("./handlers/scanHandler");
// Export as Firebase Cloud Function using v2 API
exports.scanToken = (0, https_1.onRequest)({ cors: true, maxInstances: 10, timeoutSeconds: 120 }, async (req, res) => {
    try {
        const response = await (0, scanHandler_1.handleScanRequest)(req.body);
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
