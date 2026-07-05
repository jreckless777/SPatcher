import { useState, useCallback } from 'react';
import { ScanTokenRequest, ScanTokenResponse } from '../../shared/contracts';
import { scanToken } from '../services/analysisApi';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 4000;

export interface TokenAnalysisState {
  data: ScanTokenResponse | null;
  isLoading: boolean;
  isRetrying: boolean;
  error: string | null;
}

export function useTokenAnalysis() {
  const [state, setState] = useState<TokenAnalysisState>({
    data: null,
    isLoading: false,
    isRetrying: false,
    error: null,
  });

  const analyze = useCallback(async (request: ScanTokenRequest) => {
    setState({ data: null, isLoading: true, isRetrying: false, error: null });

    let attempts = 0;

    const attemptFetch = async () => {
      attempts++;
      try {
        const response = await scanToken(request);
        setState({ data: response, isLoading: false, isRetrying: false, error: null });
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

        // Check for lock conflict message
        if (errorMessage.includes('Scanning in progress by another request') || errorMessage.includes('locked')) {
          if (attempts < MAX_RETRIES) {
            setState(prev => ({ ...prev, isRetrying: true, error: null }));
            setTimeout(attemptFetch, RETRY_DELAY_MS);
          } else {
            setState({
              data: null,
              isLoading: false,
              isRetrying: false,
              error: 'Pemindaian butuh waktu lebih lama dari biasanya. Silakan coba lagi sebentar lagi.',
            });
          }
        } else if (/429|rate-limit|rate\s*limit|too\s*many\s*requests/i.test(errorMessage)) {
          setState({
            data: null,
            isLoading: false,
            isRetrying: false,
            error: 'Layanan data sedang sibuk (rate limit dari provider), silakan coba lagi dalam beberapa saat.',
          });
        } else {
          setState({
            data: null,
            isLoading: false,
            isRetrying: false,
            error: errorMessage,
          });
        }
      }
    };

    await attemptFetch();
  }, []);

  return { ...state, analyze };
}
