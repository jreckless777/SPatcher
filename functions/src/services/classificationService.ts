import { NormalizedTransaction, RegistryEntry, ScanSummary } from '../../../shared/types';

export class ClassificationService {

  // TODO: Pass a consistent pipeline timestamp from the caller instead of using Date.now().
  public aggregateWallets(
    transfers: NormalizedTransaction[],
    poolAddress: string,
    existingRegistry: Map<string, RegistryEntry>,
    processedTxIds: Set<string>
  ): Map<string, RegistryEntry> {
    const registry = new Map(existingRegistry);
    const pool = poolAddress.toLowerCase();

    for (const t of transfers) {
      const txId = `${t.txHash}_${t.logIndex}`;
      if (processedTxIds.has(txId)) {
        continue; // Skip already processed transaction
      }
      
      const amount = t.tokenAmount;
      const timestamp = t.timestamp;
      const from = t.from.toLowerCase();
      const to = t.to.toLowerCase();

      // Handle 'from' side (Sender)
      if (from !== pool && from !== '0x0000000000000000000000000000000000000000') {
        let entry = registry.get(from);
        if (!entry) {
          entry = this.createNewRegistryEntry(from, timestamp);
        }
        if (to === pool) {
          // Sending to pool = SELLING token
          entry.sellTokenAmount += amount;
        }
        entry.lastTxAt = Math.max(entry.lastTxAt, timestamp);
        registry.set(from, entry);
      }

      // Handle 'to' side (Receiver)
      if (to !== pool && to !== '0x0000000000000000000000000000000000000000') {
        let entry = registry.get(to);
        if (!entry) {
          entry = this.createNewRegistryEntry(to, timestamp);
        }
        if (from === pool) {
          // Receiving from pool = BUYING token
          entry.buyTokenAmount += amount;
        }
        entry.lastTxAt = Math.max(entry.lastTxAt, timestamp);
        registry.set(to, entry);
      }
    }

    // Update netFlow for all entries that were modified
    for (const entry of registry.values()) {
      entry.netFlowTokenAmount = entry.buyTokenAmount - entry.sellTokenAmount;
    }

    return registry;
  }

  public classifyWalletFlow(buyTokenAmount: number, sellTokenAmount: number): 'BUY' | 'SELL' | 'NEUTRAL' {
    // BUY atau SELL tidak boleh ditebak dari pola transaksi.
    // Classification is strictly based on the aggregated token amounts.
    if (buyTokenAmount > sellTokenAmount) return 'BUY';
    if (sellTokenAmount > buyTokenAmount) return 'SELL';
    return 'NEUTRAL';
  }

  public buildSummary(
    tokenId: string,
    registryMap: Map<string, RegistryEntry>,
    existingSummary?: ScanSummary
  ): ScanSummary {
    let totalBuyTokenAmount = 0;
    let totalSellTokenAmount = 0;
    let buyCount = 0;
    let sellCount = 0;

    for (const entry of registryMap.values()) {
      totalBuyTokenAmount += entry.buyTokenAmount;
      totalSellTokenAmount += entry.sellTokenAmount;
      
      const classification = this.classifyWalletFlow(entry.buyTokenAmount, entry.sellTokenAmount);
      if (classification === 'BUY') buyCount++;
      if (classification === 'SELL') sellCount++;
    }

    const netFlowTokenAmount = totalBuyTokenAmount - totalSellTokenAmount;
    // TODO: Pass a consistent pipeline timestamp from the caller instead of using Date.now().
    const now = Date.now();

    return {
      tokenId,
      totalBuyTokenAmount,
      totalSellTokenAmount,
      netFlowTokenAmount,
      buyCount,
      sellCount,
      // USD fields are not calculated in 3B, retain existing or set 0
      totalBuyVolumeUsd: existingSummary?.totalBuyVolumeUsd || 0,
      totalSellVolumeUsd: existingSummary?.totalSellVolumeUsd || 0,
      netFlowUsd: existingSummary?.netFlowUsd || 0,
      createdAt: existingSummary?.createdAt || now,
      updatedAt: now,
    };
  }

  private createNewRegistryEntry(address: string, timestamp: number): RegistryEntry {
    // TODO: Pass a consistent pipeline timestamp from the caller instead of using Date.now().
    const now = Date.now();
    return {
      address,
      buyTokenAmount: 0,
      sellTokenAmount: 0,
      netFlowTokenAmount: 0,
      buyVolumeUsd: 0,
      sellVolumeUsd: 0,
      lastTxAt: timestamp,
      createdAt: now,
      updatedAt: now,
    };
  }
}
