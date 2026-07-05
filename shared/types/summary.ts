import { BaseEntity } from './common';

export interface ScanSummary extends BaseEntity {
  tokenId: string;
  totalBuyTokenAmount: number;
  totalSellTokenAmount: number;
  netFlowTokenAmount: number;
  totalBuyVolumeUsd: number;
  totalSellVolumeUsd: number;
  netFlowUsd: number;
  buyCount: number;
  sellCount: number;
}
