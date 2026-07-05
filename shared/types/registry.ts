import { BaseEntity } from './common';

export interface RegistryEntry extends BaseEntity {
  address: string; // Wallet address
  buyTokenAmount: number;
  sellTokenAmount: number;
  netFlowTokenAmount: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  lastTxAt: number;
}
