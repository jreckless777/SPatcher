"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlchemyProvider = void 0;
const constants_1 = require("../../../shared/constants");
class AlchemyProvider {
    apiKey;
    baseUrl;
    chainId;
    constructor(chainId) {
        this.chainId = chainId;
        this.apiKey = process.env.ALCHEMY_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[AlchemyProvider] ALCHEMY_API_KEY environment variable is not set. Will likely fail unless mocked.');
        }
        else {
            console.log(`[AlchemyProvider] Initialized with API Key starting with: ${this.apiKey.substring(0, 4)}`);
        }
        switch (chainId.toLowerCase()) {
            case 'ethereum':
            case 'eth':
            case '1':
                this.baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.apiKey}`;
                break;
            case 'base':
            case '8453':
                this.baseUrl = `https://base-mainnet.g.alchemy.com/v2/${this.apiKey}`;
                break;
            case 'polygon':
            case '137':
                this.baseUrl = `https://polygon-mainnet.g.alchemy.com/v2/${this.apiKey}`;
                break;
            case 'arbitrum':
            case '42161':
                this.baseUrl = `https://arb-mainnet.g.alchemy.com/v2/${this.apiKey}`;
                break;
            default:
                this.baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.apiKey}`;
        }
    }
    async fetchWithRetry(url, body) {
        const MAX_RETRIES = 5;
        const MAX_TOTAL_WAIT_MS = 90 * 1000; // beri margin di bawah timeoutSeconds 120 detik
        let totalWaitMs = 0;
        for (let i = 0; i <= MAX_RETRIES; i++) {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (response.ok) {
                return await response.json();
            }
            const status = response.status;
            if (status === 429 && i < MAX_RETRIES) {
                const retryAfterHeader = response.headers.get('retry-after');
                const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 0;
                const base = Math.pow(2, i);
                const jitter = Math.random() * 0.4 - 0.2;
                const delaySec = retryAfterSec > 0 ? retryAfterSec : Math.max(base * (1 + jitter), 1);
                const delayMs = delaySec * 1000;
                if (totalWaitMs + delayMs > MAX_TOTAL_WAIT_MS) {
                    console.warn(`[AlchemyProvider] Total waktu tunggu retry akan melebihi batas (${MAX_TOTAL_WAIT_MS}ms). Menyerah lebih awal.`);
                    throw new Error(`Alchemy API error: 429 Too Many Requests (batas waktu retry tercapai)`);
                }
                totalWaitMs += delayMs;
                console.warn(`[AlchemyProvider] 429 diterima, retry dalam ${delaySec.toFixed(2)} detik (percobaan ${i + 1}/${MAX_RETRIES}, total tunggu sejauh ini: ${(totalWaitMs / 1000).toFixed(1)}s)...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            if ([500, 502, 503, 504].includes(status) && i < MAX_RETRIES) {
                const base = Math.pow(2, i);
                const delayMs = base * 1000;
                if (totalWaitMs + delayMs > MAX_TOTAL_WAIT_MS) {
                    throw new Error(`Alchemy API error: ${status} (batas waktu retry tercapai)`);
                }
                totalWaitMs += delayMs;
                console.warn(`[AlchemyProvider] Status ${status} diterima, retry dalam ${base} detik...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            throw new Error(`Alchemy API error: ${status} ${response.statusText}`);
        }
        throw new Error("[AlchemyProvider] Exhausted all retries without success.");
    }
    async getCurrentBlock() {
        const res = await this.fetchWithRetry(this.baseUrl, {
            id: 1,
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: []
        });
        if (!res || !res.result) {
            throw new Error("Failed to fetch current block from Alchemy");
        }
        return parseInt(res.result, 16);
    }
    getEstimatedBlocksPerDay(baseUrl) {
        // TODO: Implement accurate time-to-block conversion mechanism. 
        // Chain block times are not strictly fixed. This is just a fallback estimate.
        if (baseUrl.includes('eth-mainnet'))
            return 7200; // ~12s
        if (baseUrl.includes('base-mainnet'))
            return 43200; // ~2s
        if (baseUrl.includes('polygon-mainnet'))
            return 43200; // ~2s
        if (baseUrl.includes('arb-mainnet'))
            return 345600; // ~0.25s
        return 7200;
    }
    async getTransfers(tokenAddress, lastScannedBlock) {
        const currentBlock = await this.getCurrentBlock();
        let fromBlock = lastScannedBlock;
        if (!fromBlock || fromBlock === 0) {
            const blocksPerDay = this.getEstimatedBlocksPerDay(this.baseUrl);
            fromBlock = Math.max(0, currentBlock - (constants_1.MAX_INITIAL_LOOKBACK_DAYS * blocksPerDay));
            console.log(`[AlchemyProvider] No lastScannedBlock. Starting from calculated block: ${fromBlock}`);
        }
        else {
            console.log(`[AlchemyProvider] Resuming scan from lastScannedBlock: ${fromBlock}`);
        }
        let transfers = [];
        let pageKey = undefined;
        let pagesFetched = 0;
        while (pagesFetched < constants_1.MAX_PAGES_PER_SCAN) {
            const res = await this.fetchWithRetry(this.baseUrl, {
                id: 1,
                jsonrpc: "2.0",
                method: "alchemy_getAssetTransfers",
                params: [{
                        fromBlock: "0x" + fromBlock.toString(16),
                        toBlock: "0x" + currentBlock.toString(16),
                        contractAddresses: [tokenAddress],
                        category: ["erc20"],
                        withMetadata: true,
                        excludeZeroValue: true,
                        pageKey: pageKey
                    }]
            });
            const result = res.result;
            // Delay to prevent hitting burst rate limit
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!result || !result.transfers) {
                break;
            }
            for (const t of result.transfers) {
                const valueNum = t.value || 0;
                // Convert timestamp (e.g. "2023-01-01T00:00:00.000Z") to unix timestamp
                let timestamp = Date.now();
                if (t.metadata && t.metadata.blockTimestamp) {
                    timestamp = new Date(t.metadata.blockTimestamp).getTime();
                }
                const blockNum = parseInt(t.blockNum, 16);
                // Try to parse logIndex from the response, if not present use 0
                // alchemy returns a string like "0x1b"
                let logIndex = 0;
                if (t.logIndex) {
                    logIndex = parseInt(t.logIndex, 16);
                }
                let decimals = 18;
                if (t.rawContract && t.rawContract.decimal) {
                    decimals = parseInt(t.rawContract.decimal, 16);
                }
                transfers.push({
                    txHash: t.hash,
                    logIndex: logIndex,
                    blockNumber: blockNum,
                    timestamp: timestamp,
                    from: (t.from || '').toLowerCase(),
                    to: (t.to || '').toLowerCase(),
                    tokenAmount: valueNum,
                    tokenAddress: tokenAddress.toLowerCase(),
                    chainId: this.chainId,
                    tokenDecimals: decimals
                });
            }
            pageKey = result.pageKey;
            pagesFetched++;
            if (!pageKey) {
                break;
            }
        }
        let nextBlockToScan = currentBlock;
        if (pageKey) {
            if (transfers.length > 0) {
                const maxBlockInBatch = Math.max(...transfers.map(t => t.blockNumber));
                nextBlockToScan = maxBlockInBatch;
            }
            else {
                nextBlockToScan = fromBlock;
            }
        }
        return { transfers, nextBlockToScan };
    }
}
exports.AlchemyProvider = AlchemyProvider;
