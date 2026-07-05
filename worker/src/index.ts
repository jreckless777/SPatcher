import { handleApiRequest } from './handlers/apiHandler';
import { Env } from './config/env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/scan') {
      return handleApiRequest(request, env);
    }
    return new Response('Not Found', { status: 404 });
  }
};
