import { db } from '../config/firebase';
import { CACHE_TTL_MS } from '../../../shared/constants';

export class CacheRepository {
  async isFresh(tokenId: string, lastScannedAt: number): Promise<boolean> {
    const now = Date.now();
    return (now - lastScannedAt) < CACHE_TTL_MS;
  }

  async touch(tokenId: string): Promise<void> {
    // TODO (Tahap 3): Update lastScannedAt in Firestore
    console.log(`[CacheRepository] Touched token ${tokenId}`);
  }
}
