/**
 * Proxies /api/* → your Express server. Target port MUST match server (see server log
 * "Listening on http://localhost:XXXX"). Set REACT_APP_API_PORT or REACT_APP_PROXY_TARGET
 * in client/.env.development — restart npm start after changing.
 */
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.REACT_APP_API_PORT || process.env.PROXY_API_PORT || 5000;
const API_TARGET =
  process.env.REACT_APP_PROXY_TARGET ||
  `http://127.0.0.1:${port}`;

module.exports = function (app) {
  console.log(`[setupProxy] Forwarding /api → ${API_TARGET}/api`);
  app.use(
    "/api",
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true,
      timeout: 120000,
      proxyTimeout: 120000,
      onError(err, req, res) {
        console.warn("[setupProxy] Proxy error:", err.code || err.message);
        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: `Could not reach API at ${API_TARGET}. Start the server and set REACT_APP_API_PORT (or REACT_APP_PROXY_TARGET) in client/.env.development to match server PORT.`,
            })
          );
        }
      },
    })
  );
};
