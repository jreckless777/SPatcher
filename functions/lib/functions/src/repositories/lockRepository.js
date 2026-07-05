"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockRepository = void 0;
const firebase_1 = require("../config/firebase");
const constants_1 = require("../../../shared/constants");
class LockRepository {
    collection = 'tokens';
    async acquireLock(tokenId) {
        const docRef = firebase_1.db.collection(this.collection).doc(tokenId);
        try {
            return await firebase_1.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                const now = Date.now();
                if (!doc.exists) {
                    // Document doesn't exist, create it with lock
                    transaction.set(docRef, {
                        tokenId,
                        scanningInProgress: true,
                        scanningStartedAt: now,
                        createdAt: now,
                        updatedAt: now,
                    }, { merge: true });
                    console.log(`[LockRepository] Lock acquired (new document) for ${tokenId}`);
                    return true;
                }
                const data = doc.data();
                const scanningInProgress = data?.scanningInProgress;
                const scanningStartedAt = data?.scanningStartedAt;
                if (!scanningInProgress) {
                    // Lock is free
                    transaction.update(docRef, {
                        scanningInProgress: true,
                        scanningStartedAt: now,
                        updatedAt: now,
                    });
                    console.log(`[LockRepository] Lock acquired (was free) for ${tokenId}`);
                    return true;
                }
                // Lock is active, check if stale
                if (scanningStartedAt && (now - scanningStartedAt) > constants_1.LOCK_TIMEOUT_MS) {
                    // Lock is stale, take it over
                    transaction.update(docRef, {
                        scanningInProgress: true,
                        scanningStartedAt: now,
                        updatedAt: now,
                    });
                    console.log(`[LockRepository] Lock acquired (took over stale lock) for ${tokenId}`);
                    return true;
                }
                // Lock is active and not stale
                console.log(`[LockRepository] Lock denied (active) for ${tokenId}`);
                return false;
            });
        }
        catch (error) {
            console.error(`[LockRepository] Error acquiring lock for ${tokenId}:`, error);
            return false;
        }
    }
    async releaseLock(tokenId) {
        const docRef = firebase_1.db.collection(this.collection).doc(tokenId);
        try {
            await docRef.update({
                scanningInProgress: false,
                scanningStartedAt: null,
                updatedAt: Date.now(),
            });
            console.log(`[LockRepository] Lock released for ${tokenId}`);
        }
        catch (error) {
            if (error.code === 5 || error.code === 'not-found') {
                // NOT_FOUND, fine to ignore
                console.log(`[LockRepository] Lock release ignored, document not found for ${tokenId}`);
            }
            else {
                console.error(`[LockRepository] Error releasing lock for ${tokenId}:`, error);
            }
        }
    }
    async isLocked(tokenId) {
        try {
            const docRef = firebase_1.db.collection(this.collection).doc(tokenId);
            const doc = await docRef.get();
            if (!doc.exists) {
                return false;
            }
            const data = doc.data();
            if (!data?.scanningInProgress) {
                return false;
            }
            const now = Date.now();
            if (data.scanningStartedAt && (now - data.scanningStartedAt) > constants_1.LOCK_TIMEOUT_MS) {
                return false; // Stale lock
            }
            return true; // Lock is active and valid
        }
        catch (error) {
            console.error(`[LockRepository] Error checking lock status for ${tokenId}:`, error);
            return false;
        }
    }
}
exports.LockRepository = LockRepository;
