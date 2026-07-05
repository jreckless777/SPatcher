"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheRepository = void 0;
const constants_1 = require("../../../shared/constants");
class CacheRepository {
    async isFresh(tokenId, lastScannedAt) {
        const now = Date.now();
        return (now - lastScannedAt) < constants_1.CACHE_TTL_MS;
    }
    async touch(tokenId) {
        // TODO (Tahap 3): Update lastScannedAt in Firestore
        console.log(`[CacheRepository] Touched token ${tokenId}`);
    }
}
exports.CacheRepository = CacheRepository;
