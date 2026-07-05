import React from 'react';
import { ScanSummary } from '../../../shared/types';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ScanSummaryPanelProps {
  summary: ScanSummary;
  source: 'cache' | 'fresh_scan';
  className?: string;
}

export function ScanSummaryPanel({ summary, source, className }: ScanSummaryPanelProps) {
  const isNetPositive = summary.netFlowTokenAmount > 0;
  const isNetNegative = summary.netFlowTokenAmount < 0;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Header and Source Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary">Analysis Summary</h2>
        <Badge variant={source === 'cache' ? 'neutral' : 'success'} className="uppercase tracking-wider text-[10px]">
          {source === 'cache' ? 'Cached' : 'Fresh Scan'}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Buy Volume */}
        <div className="flex flex-col p-4 rounded-xl border border-divider bg-bg-elevated">
          <span className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Total Buy Amount</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono tabular-nums text-status-success">
              {summary.totalBuyTokenAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
            <span className="text-xs text-text-secondary font-mono">({summary.buyCount} tx)</span>
          </div>
        </div>

        {/* Sell Volume */}
        <div className="flex flex-col p-4 rounded-xl border border-divider bg-bg-elevated">
          <span className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Total Sell Amount</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono tabular-nums text-status-error">
              {summary.totalSellTokenAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
            <span className="text-xs text-text-secondary font-mono">({summary.sellCount} tx)</span>
          </div>
        </div>

        {/* Net Flow */}
        <div className="flex flex-col p-4 rounded-xl border border-divider bg-bg-elevated">
          <span className="text-xs text-text-secondary mb-2 uppercase tracking-wider">Net Flow</span>
          <span className={cn(
            "text-2xl font-mono tabular-nums",
            isNetPositive ? "text-status-success" : isNetNegative ? "text-status-error" : "text-text-primary"
          )}>
            {summary.netFlowTokenAmount > 0 ? '+' : ''}
            {summary.netFlowTokenAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
        </div>

      </div>

      {/* Placeholder for Registry List (to be implemented later) */}
      {/* 
      <div className="mt-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">Top Wallets</h3>
        <p className="text-xs text-text-secondary italic">Registry data not available in current response.</p>
      </div>
      */}
    </div>
  );
}
