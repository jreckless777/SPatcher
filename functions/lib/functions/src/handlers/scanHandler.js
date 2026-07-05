"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleScanRequest = void 0;
const pipelineService_1 = require("../services/pipelineService");
const pipelineService = new pipelineService_1.PipelineService();
const handleScanRequest = async (requestBody) => {
    // Validate request
    if (!requestBody || !requestBody.tokenId || !requestBody.chainId) {
        throw new Error('Invalid request: missing tokenId or chainId');
    }
    if (!requestBody.poolAddress || !requestBody.poolAddress.trim()) {
        throw new Error('Pool Address wajib diisi untuk klasifikasi buy/sell yang akurat');
    }
    const req = {
        tokenId: requestBody.tokenId,
        chainId: requestBody.chainId,
        poolAddress: requestBody.poolAddress,
    };
    return pipelineService.processScan(req);
};
exports.handleScanRequest = handleScanRequest;
