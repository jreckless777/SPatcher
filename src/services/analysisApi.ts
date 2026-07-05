import { ScanTokenRequest, ScanTokenResponse } from '../../shared/contracts';

// We use VITE_WORKER_URL if provided, otherwise default to empty string so it uses the Vite proxy
const API_BASE_URL = import.meta.env.VITE_WORKER_URL || '';

export async function scanToken(request: ScanTokenRequest): Promise<ScanTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
