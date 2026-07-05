import { TokenRecord, ScanSummary } from '../types';

export interface ScanTokenRequest {
  tokenId: string;
  chainId: string;
  poolAddress?: string;
}

export interface ScanTokenResponse {
  success: boolean;
  source: 'cache' | 'fresh_scan';
  timestamp: number;
  payload: {
    token: TokenRecord;
    summary: ScanSummary;
  };
}
