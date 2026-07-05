import { getFirestore } from 'firebase-admin/firestore';
import { TokenRecord, RegistryEntry, ScanSummary } from '../../../shared/types';

export class TokenRepository {
  private get db() {
    return getFirestore();
  }

  public async getToken(tokenId: string): Promise<TokenRecord | null> {
    const doc = await this.db.collection('tokens').doc(tokenId).get();
    if (!doc.exists) return null;
    const token = doc.data() as TokenRecord;
    
    // If the record exists but doesn't have a chainId, it's a lock-only partial write.
    // Treating it as null lets the service initialize it fully with safe default values.
    if (!token.chainId) {
      console.log(`[TokenRepository] Document for ${tokenId} exists but is incomplete (no chainId). Treating as null.`);
      return null;
    }
    
    return token;
  }

  public async saveToken(token: TokenRecord): Promise<void> {
    await this.db.collection('tokens').doc(token.tokenId).set(token, { merge: true });
  }

  public async saveSummary(summary: ScanSummary): Promise<void> {
    // Save to the subcollection "summary" under tokens/{tokenId} (assuming we keep a history)
    // Or we can save it as the latest summary in "summaries" root collection
    // Let's store in a root collection "summaries" with id = tokenId, matching Tahap 2 structure if any
    await this.db.collection('summaries').doc(summary.tokenId).set(summary, { merge: true });
  }

  public async saveRegistry(tokenId: string, entries: RegistryEntry[]): Promise<void> {
    const batch = this.db.batch();
    const collectionRef = this.db.collection('tokens').doc(tokenId).collection('registry');
    
    // Process in chunks of 500 (Firestore limit)
    const chunkSize = 500;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      const chunkBatch = this.db.batch();
      
      for (const entry of chunk) {
        const docRef = collectionRef.doc(entry.address);
        chunkBatch.set(docRef, entry, { merge: true });
      }
      
      await chunkBatch.commit();
    }
  }

  public async getRegistryMap(tokenId: string): Promise<Map<string, RegistryEntry>> {
    const snapshot = await this.db.collection('tokens').doc(tokenId).collection('registry').get();
    const registryMap = new Map<string, RegistryEntry>();
    
    for (const doc of snapshot.docs) {
      const entry = doc.data() as RegistryEntry;
      registryMap.set(entry.address, entry);
    }
    
    return registryMap;
  }
}
