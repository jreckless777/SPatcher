export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: restrict to frontend domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handleOptions = (request: Request) => {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(null, { headers: { Allow: 'GET, POST, OPTIONS' } });
};
