import { PipelineService } from './services/pipelineService';
import { AlchemyProvider } from './providers/AlchemyProvider';

async function main() {
  const service = new PipelineService();
  const req = {
    tokenId: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    chainId: 'ethereum',
    poolAddress: '0x0d4a11d5EEaaC28Ec3F61d100daF4d40471f1852' // Uniswap V2 WETH/USDT
  };
  
  console.log("=== RAW ETHERSCAN/ALCHEMY METRICS ===");
  const provider = new AlchemyProvider(req.chainId);
  const currentBlock = await (provider as any).getCurrentBlock();
  
  // Calculate block lookback similar to the provider
  const blocksPerDay = (provider as any).getEstimatedBlocksPerDay((provider as any).baseUrl);
  const fromBlockCalculated = Math.max(0, currentBlock - (90 * blocksPerDay)); // MAX_INITIAL_LOOKBACK_DAYS = 90
  
  console.log(`calculated blocksPerDay: ${blocksPerDay}`);
  console.log(`currentBlock: ${currentBlock}`);
  console.log(`calculated fromBlock (90 days): ${fromBlockCalculated}`);
  console.log(`Requested poolAddress: ${req.poolAddress.toLowerCase()}`);

  const { transfers, nextBlockToScan } = await provider.getTransfers(req.tokenId, 0);
  console.log(`\nTotal NormalizedTransaction fetched: ${transfers.length}`);
  if (transfers.length > 0) {
    const minBlockInTransfers = Math.min(...transfers.map(t => t.blockNumber));
    const maxBlockInTransfers = Math.max(...transfers.map(t => t.blockNumber));
    console.log(`Actual block range of fetched transfers: ${minBlockInTransfers} to ${maxBlockInTransfers} (Total blocks covered: ${maxBlockInTransfers - minBlockInTransfers + 1})`);
    
    // Check pool interactions
    const pool = req.poolAddress.toLowerCase();
    const poolTransfers = transfers.filter(t => t.from === pool || t.to === pool);
    console.log(`Total transfers matching pool address: ${poolTransfers.length}`);
    if (poolTransfers.length > 0) {
      console.log("Matched pool transfers sample (up to 5):");
      console.log(JSON.stringify(poolTransfers.slice(0, 5), null, 2));
    }
  }

  console.log("\n=== FIRST SCAN ===");
  const res1 = await service.processScan(req);
  console.log(JSON.stringify(res1.payload.summary, null, 2));
  console.log("lastScannedBlockTxIds:", (res1.payload.token as any).lastScannedBlockTxIds);
  
  console.log("\n=== WAITING 21 SECONDS TO BYPASS CACHE ===");
  await new Promise(r => setTimeout(r, 21000));
  
  console.log("\n=== SECOND SCAN (INCREMENTAL) ===");
  const res2 = await service.processScan(req);
  console.log(JSON.stringify(res2.payload.summary, null, 2));
  console.log("lastScannedBlockTxIds:", (res2.payload.token as any).lastScannedBlockTxIds);
}

main().catch(console.error);
