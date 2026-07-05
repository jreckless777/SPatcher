var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-PV1yGY/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/middleware/cors.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // TODO: restrict to frontend domain
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var handleOptions = /* @__PURE__ */ __name((request) => {
  if (request.headers.get("Origin") !== null && request.headers.get("Access-Control-Request-Method") !== null && request.headers.get("Access-Control-Request-Headers") !== null) {
    return new Response(null, { headers: corsHeaders });
  }
  return new Response(null, { headers: { Allow: "GET, POST, OPTIONS" } });
}, "handleOptions");

// ../shared/constants/index.ts
var CACHE_TTL_MS = 20 * 1e3;
var LOCK_TIMEOUT_MS = 30 * 1e3;

// src/handlers/apiHandler.ts
async function getFirestoreDoc(projectId, apiKey, collection, docId, env) {
  let baseUrl = env.FIRESTORE_EMULATOR_HOST ? `http://${env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents` : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  let url = `${baseUrl}/${collection}/${docId}`;
  if (apiKey) {
    url += `?key=${apiKey}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Firestore read failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
__name(getFirestoreDoc, "getFirestoreDoc");
function mapFirestoreToToken(doc) {
  const fields = doc.fields || {};
  return {
    tokenId: fields.tokenId?.stringValue || "",
    chainId: fields.chainId?.stringValue || "",
    poolAddress: fields.poolAddress?.stringValue || "",
    lastScannedAt: parseInt(fields.lastScannedAt?.integerValue || "0", 10),
    lastScannedBlock: parseInt(fields.lastScannedBlock?.integerValue || "0", 10),
    scanningInProgress: fields.scanningInProgress?.booleanValue || false,
    scanningStartedAt: fields.scanningStartedAt?.integerValue ? parseInt(fields.scanningStartedAt.integerValue, 10) : null,
    createdAt: parseInt(fields.createdAt?.integerValue || "0", 10),
    updatedAt: parseInt(fields.updatedAt?.integerValue || "0", 10)
  };
}
__name(mapFirestoreToToken, "mapFirestoreToToken");
function mapFirestoreToSummary(doc) {
  const fields = doc.fields || {};
  return {
    tokenId: fields.tokenId?.stringValue || "",
    totalBuyTokenAmount: parseFloat(fields.totalBuyTokenAmount?.doubleValue || fields.totalBuyTokenAmount?.integerValue || "0"),
    totalSellTokenAmount: parseFloat(fields.totalSellTokenAmount?.doubleValue || fields.totalSellTokenAmount?.integerValue || "0"),
    netFlowTokenAmount: parseFloat(fields.netFlowTokenAmount?.doubleValue || fields.netFlowTokenAmount?.integerValue || "0"),
    totalBuyVolumeUsd: parseFloat(fields.totalBuyVolumeUsd?.doubleValue || fields.totalBuyVolumeUsd?.integerValue || "0"),
    totalSellVolumeUsd: parseFloat(fields.totalSellVolumeUsd?.doubleValue || fields.totalSellVolumeUsd?.integerValue || "0"),
    netFlowUsd: parseFloat(fields.netFlowUsd?.doubleValue || fields.netFlowUsd?.integerValue || "0"),
    buyCount: parseInt(fields.buyCount?.integerValue || "0", 10),
    sellCount: parseInt(fields.sellCount?.integerValue || "0", 10),
    createdAt: parseInt(fields.createdAt?.integerValue || "0", 10),
    updatedAt: parseInt(fields.updatedAt?.integerValue || "0", 10)
  };
}
__name(mapFirestoreToSummary, "mapFirestoreToSummary");
var handleApiRequest = /* @__PURE__ */ __name(async (request, env) => {
  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const body = await request.json();
    const tokenId = body.tokenId.toLowerCase();
    const chainId = body.chainId.toLowerCase();
    if (env.FIRESTORE_PROJECT_ID) {
      try {
        const tokenDoc = await getFirestoreDoc(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY, "tokens", tokenId, env);
        if (tokenDoc) {
          const token = mapFirestoreToToken(tokenDoc);
          const now = Date.now();
          if (now - token.lastScannedAt < CACHE_TTL_MS) {
            const summaryDoc = await getFirestoreDoc(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY, "summaries", tokenId, env);
            if (summaryDoc) {
              const summary = mapFirestoreToSummary(summaryDoc);
              console.log(`[Worker] Cache hit for ${tokenId}`);
              return new Response(JSON.stringify({
                success: true,
                source: "cache",
                timestamp: now,
                payload: {
                  token,
                  summary
                }
              }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders }
              });
            }
          }
        }
      } catch (err) {
        console.error("[Worker] Firestore read error:", err);
      }
    }
    const functionUrl = env.FIREBASE_FUNCTION_URL || "http://localhost:5001/mock-project/us-central1/scanToken";
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...body, tokenId, chainId })
      // Pass normalized payload
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}, "handleApiRequest");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }
    if (url.pathname === "/api/scan") {
      return handleApiRequest(request, env);
    }
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// ../../../opt/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../opt/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-PV1yGY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../opt/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-PV1yGY/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
