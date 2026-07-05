import { BaseEntity } from './common';

export interface TokenBase {
  tokenId: string; // Contract address
  chainId: string; // e.g., 'solana', 'ethereum'
}

export interface TokenMetadata extends TokenBase {
  name: string;
  symbol: string;
  decimals: number;
}

export interface TokenRecord extends TokenBase, BaseEntity {
  poolAddress: string; // The primary liquidity pool address for detecting buys/sells
  lastScannedAt: number;
  lastScannedBlock: number;
  scanningInProgress: boolean;
  scanningStartedAt: number | null;
  lastScannedBlockTxIds?: string[];
  // TODO (Tahap 3): Add fields for Behavior, Dominance, etc.
}
