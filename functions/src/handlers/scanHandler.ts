import { PipelineService } from '../services/pipelineService';
import { ScanTokenRequest, ScanTokenResponse } from '../../../shared/contracts';

const pipelineService = new PipelineService();

export const handleScanRequest = async (requestBody: any): Promise<ScanTokenResponse> => {
  // Validate request
  if (!requestBody || !requestBody.tokenId || !requestBody.chainId) {
    throw new Error('Invalid request: missing tokenId or chainId');
  }

  if (!requestBody.poolAddress || !requestBody.poolAddress.trim()) {
    throw new Error('Pool Address wajib diisi untuk klasifikasi buy/sell yang akurat');
  }

  const req: ScanTokenRequest = {
    tokenId: requestBody.tokenId,
    chainId: requestBody.chainId,
    poolAddress: requestBody.poolAddress,
  };

  return pipelineService.processScan(req);
};
