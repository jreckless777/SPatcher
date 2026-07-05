import { LockRepository } from './lockRepository';
import { db } from '../config/firebase';

async function cleanup(tokenId: string) {
  try {
    await db.collection('tokens').doc(tokenId).delete();
  } catch (error) {
    // Ignore error
  }
}

async function runTests() {
  console.log("=== STARTING LOCK TESTS (EMULATOR) ===");
  const repo = new LockRepository();
  const tokenId = "test-token-123";

  // Cleanup before starting
  await cleanup(tokenId);

  // Scenario A: 2 concurrent requests
  console.log("\n--- Test A: 2 concurrent requests on missing token ---");
  const req1 = repo.acquireLock(tokenId);
  const req2 = repo.acquireLock(tokenId);
  
  const resultsA = await Promise.all([req1, req2]);
  console.log(`Results: ${resultsA}`);
  
  const truesA = resultsA.filter(r => r === true).length;
  const falsesA = resultsA.filter(r => r === false).length;
  console.log(`Got ${truesA} true and ${falsesA} false. Expected: 1 true, 1 false.`);
  
  if (truesA !== 1 || falsesA !== 1) {
    console.error("TEST A FAILED");
  } else {
    console.log("TEST A PASSED");
  }

  // Cleanup for next test
  await cleanup(tokenId);

  // Scenario B: 10 concurrent requests
  console.log("\n--- Test B: 10 concurrent requests on missing token ---");
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(repo.acquireLock(tokenId));
  }
  
  const resultsB = await Promise.all(promises);
  console.log(`Results: ${resultsB}`);
  
  const truesB = resultsB.filter(r => r === true).length;
  const falsesB = resultsB.filter(r => r === false).length;
  console.log(`Got ${truesB} true and ${falsesB} false. Expected: 1 true, 9 false.`);
  
  if (truesB !== 1 || falsesB !== 9) {
    console.error("TEST B FAILED");
  } else {
    console.log("TEST B PASSED");
  }

  // Scenario C: Acquire -> Release -> Acquire
  console.log("\n--- Test C: Acquire -> Release -> Acquire ---");
  await cleanup(tokenId);
  
  let acq1 = await repo.acquireLock(tokenId);
  console.log(`First acquire: ${acq1}`);
  
  await repo.releaseLock(tokenId);
  let isLocked = await repo.isLocked(tokenId);
  console.log(`Is Locked after release?: ${isLocked}`);
  
  let acq2 = await repo.acquireLock(tokenId);
  console.log(`Second acquire (after release): ${acq2}`);
  
  if (acq1 && !isLocked && acq2) {
    console.log("TEST C PASSED");
  } else {
    console.error("TEST C FAILED");
  }

  // Scenario D: Stale Lock Takeover
  console.log("\n--- Test D: Stale Lock Takeover ---");
  await cleanup(tokenId);
  
  // Create a stale lock manually
  await db.collection('tokens').doc(tokenId).set({
    tokenId,
    scanningInProgress: true,
    scanningStartedAt: Date.now() - (40 * 1000), // 40 seconds ago (timeout is 30s)
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  
  isLocked = await repo.isLocked(tokenId);
  console.log(`Is Locked before stale takeover?: ${isLocked} (Expected: false due to timeout)`);
  
  const acq3 = await repo.acquireLock(tokenId);
  console.log(`Acquire stale lock result: ${acq3}`);
  
  if (!isLocked && acq3) {
    console.log("TEST D PASSED");
  } else {
    console.error("TEST D FAILED");
  }

  // Final cleanup
  await cleanup(tokenId);
  console.log("\n=== TESTS FINISHED ===");
}

runTests().catch(console.error).finally(() => process.exit(0));
