"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAGES_PER_SCAN = exports.MAX_INITIAL_LOOKBACK_DAYS = exports.LOCK_TIMEOUT_MS = exports.CACHE_TTL_MS = void 0;
exports.CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
exports.LOCK_TIMEOUT_MS = 30 * 1000; // 30 seconds max lock
exports.MAX_INITIAL_LOOKBACK_DAYS = 7;
exports.MAX_PAGES_PER_SCAN = 5;
