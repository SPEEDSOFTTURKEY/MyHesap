const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use(
  "/api",
  createProxyMiddleware({
    target: "https://localhost:44375/",
    changeOrigin: true,
    secure: true, // Verify SSL certificate
    pathRewrite: { "^/api": "/api" }, // Keep /api in the URL
    headers: {
      accept: "*/*",
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(500).json({ error: "Proxy error: " + err.message });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`Proxying: ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`Response: ${proxyRes.statusCode}`);
    },
  }),
);

const port = 3001;
app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
