import React, { useState } from 'react';
import { useTokenAnalysis } from '../hooks/useTokenAnalysis';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ScanSummaryPanel } from '../components/domain/ScanSummaryPanel';
import { ScanTokenRequest } from '../../shared/contracts';

export function TokenAnalysis() {
  const { data, isLoading, isRetrying, error, analyze } = useTokenAnalysis();
  
  const [formData, setFormData] = useState<ScanTokenRequest>({
    tokenId: '',
    chainId: 'ethereum',
    poolAddress: ''
  });

  const [poolError, setPoolError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tokenId || !formData.chainId) return;
    
    if (!formData.poolAddress || !formData.poolAddress.trim()) {
      setPoolError('Pool Address wajib diisi.');
      return;
    }
    
    setPoolError('');
    analyze(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'poolAddress' && value.trim()) {
      setPoolError('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-medium tracking-tight text-text-primary">Token Analysis</h1>
        <p className="text-sm text-text-secondary">
          Analyze token flow, identify key wallets, and track accumulation in real-time.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end p-6 rounded-2xl border border-divider bg-bg-elevated/50">
        <div className="w-full md:w-1/3">
          <Input 
            label="Token Address" 
            name="tokenId"
            placeholder="0x..." 
            value={formData.tokenId}
            onChange={handleInputChange}
            required
            disabled={isLoading || isRetrying}
          />
        </div>
        <div className="w-full md:w-1/4">
          <Input 
            label="Chain ID" 
            name="chainId"
            placeholder="ethereum" 
            value={formData.chainId}
            onChange={handleInputChange}
            required
            disabled={isLoading || isRetrying}
          />
        </div>
        <div className="w-full md:w-1/3">
          <Input 
            label="Pool Address" 
            name="poolAddress"
            placeholder="0x..." 
            value={formData.poolAddress}
            onChange={handleInputChange}
            required
            error={poolError}
            disabled={isLoading || isRetrying}
          />
        </div>
        <div className="w-full md:w-auto">
          <Button 
            type="submit" 
            disabled={isLoading || isRetrying || !formData.tokenId || !formData.chainId || !formData.poolAddress}
            className="w-full md:w-auto h-10"
          >
            {isLoading && !isRetrying ? 'Analyzing...' : isRetrying ? 'Waiting...' : 'Analyze'}
          </Button>
        </div>
      </form>

      {/* States Handling */}
      <div className="flex flex-col gap-6">
        
        {/* Loading / Retrying State */}
        {(isLoading || isRetrying) && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
            <div className="w-6 h-6 rounded-full border-2 border-divider border-t-accent animate-spin" />
            <p className="text-sm text-text-secondary">
              {isRetrying 
                ? 'Sedang memindai data terbaru, mohon tunggu...' 
                : 'Fetching blockchain data...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && !isRetrying && (
          <div className="p-5 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-sm animate-in fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 font-medium">
              {error}
            </div>
            <Button
              type="button"
              onClick={() => analyze(formData)}
              variant="secondary"
              size="sm"
              className="text-status-error border-status-error/20 hover:bg-status-error/10 hover:text-status-error shrink-0"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !isRetrying && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-divider rounded-2xl bg-bg-elevated/30">
            <p className="text-text-secondary text-sm">Enter a token address to start analyzing on-chain flow.</p>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && !isRetrying && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <ScanSummaryPanel 
              summary={data.payload.summary} 
              source={data.source} 
            />
          </div>
        )}

      </div>
    </div>
  );
}
