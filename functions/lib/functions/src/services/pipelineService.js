"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineService = void 0;
const cacheRepository_1 = require("../repositories/cacheRepository");
const lockRepository_1 = require("../repositories/lockRepository");
const tokenRepository_1 = require("../repositories/tokenRepository");
const AlchemyProvider_1 = require("../providers/AlchemyProvider");
const classificationService_1 = require("./classificationService");
class PipelineService {
    cacheRepo = new cacheRepository_1.CacheRepository();
    lockRepo = new lockRepository_1.LockRepository();
    tokenRepo = new tokenRepository_1.TokenRepository();
    classificationService = new classificationService_1.ClassificationService();
    async processScan(req) {
        const tokenId = req.tokenId.toLowerCase();
        const chainId = req.chainId.toLowerCase();
        const poolAddress = (req.poolAddress || '0x0000000000000000000000000000000000000000').toLowerCase();
        // 1. Read existing record
        let token = await this.tokenRepo.getToken(tokenId);
        const now = Date.now();
        // 2. Check freshness
        if (token && await this.cacheRepo.isFresh(tokenId, token.lastScannedAt)) {
            console.log(`[PipelineService] Cache hit for ${tokenId}`);
            const existingRegistry = await this.tokenRepo.getRegistryMap(tokenId);
            const summary = this.classificationService.buildSummary(tokenId, existingRegistry);
            return {
                success: true,
                source: 'cache',
                timestamp: now,
                payload: {
                    token: token,
                    summary: summary
                }
            };
        }
        // 3. Check and acquire lock
        const locked = await this.lockRepo.acquireLock(tokenId);
        if (!locked) {
            throw new Error('Scanning in progress by another request');
        }
        try {
            console.log(`[PipelineService] Starting fresh scan for ${tokenId}`);
            if (!token) {
                token = {
                    tokenId,
                    chainId,
                    poolAddress,
                    lastScannedAt: 0,
                    lastScannedBlock: 0,
                    scanningInProgress: true,
                    scanningStartedAt: now,
                    createdAt: now,
                    updatedAt: now,
                    lastScannedBlockTxIds: []
                };
            }
            else {
                // Defensive check: If the document exists but was created with minimal fields (e.g. during a lock-only write)
                token.chainId = token.chainId || chainId;
                token.poolAddress = token.poolAddress || poolAddress;
                token.lastScannedBlock = token.lastScannedBlock || 0;
                token.lastScannedBlockTxIds = token.lastScannedBlockTxIds || [];
                token.scanningInProgress = true;
                token.scanningStartedAt = now;
                token.updatedAt = now;
            }
            // 4. Provider Fetch
            const provider = new AlchemyProvider_1.AlchemyProvider(chainId);
            const { transfers, nextBlockToScan } = await provider.getTransfers(tokenId, token.lastScannedBlock);
            // 5. Load dedup state
            const processedTxSet = new Set(token.lastScannedBlockTxIds || []);
            // 6. Load existing registry
            const existingRegistry = await this.tokenRepo.getRegistryMap(tokenId);
            // 7. Aggregate wallets & deduplicate
            const updatedRegistryMap = this.classificationService.aggregateWallets(transfers, poolAddress, existingRegistry, processedTxSet);
            // 8. Extract txIds for nextBlockToScan only (for deduplication in the next scan)
            const newLastScannedBlockTxIds = transfers
                .filter(t => t.blockNumber === nextBlockToScan)
                .map(t => `${t.txHash}_${t.logIndex}`);
            if (newLastScannedBlockTxIds.length > 0) {
                // If we advanced to a new block, we replace the deduplication array.
                // If we didn't advance (nextBlockToScan === lastScannedBlock), we merge with existing to accumulate the batch.
                if (nextBlockToScan === token.lastScannedBlock) {
                    token.lastScannedBlockTxIds = Array.from(new Set([...(token.lastScannedBlockTxIds || []), ...newLastScannedBlockTxIds]));
                }
                else {
                    token.lastScannedBlockTxIds = newLastScannedBlockTxIds;
                }
            }
            else {
                token.lastScannedBlockTxIds = [];
            }
            // 9. Build Summary
            const summary = this.classificationService.buildSummary(tokenId, updatedRegistryMap);
            // 10. Update DB
            token.lastScannedAt = now;
            token.lastScannedBlock = nextBlockToScan;
            token.scanningInProgress = false;
            token.scanningStartedAt = null;
            // TODO (Hardening): If any write in Promise.all fails while others succeed, the state can get desynchronized.
            // Consider wrapping these in a Firestore Transaction or implementing robust recovery in the future.
            await Promise.all([
                this.tokenRepo.saveToken(token),
                this.tokenRepo.saveSummary(summary),
                this.tokenRepo.saveRegistry(tokenId, Array.from(updatedRegistryMap.values()))
            ]);
            console.log(`[PipelineService] Pipeline completed for ${tokenId}`);
            return {
                success: true,
                source: 'fresh_scan',
                timestamp: now,
                payload: {
                    token: token,
                    summary: summary
                }
            };
        }
        finally {
            // 11. Release lock
            await this.lockRepo.releaseLock(tokenId);
        }
    }
}
exports.PipelineService = PipelineService;
