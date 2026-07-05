export interface NormalizedTransaction {
  txHash: string;
  logIndex: number;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  tokenAmount: number;
  tokenAddress: string;
  chainId: string;
  tokenDecimals: number;
}
