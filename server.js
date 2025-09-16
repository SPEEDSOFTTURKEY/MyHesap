const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path"); // path modülünü ekle
const app = express();

// API istekleri için proxy
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://localhost:44375/",
    changeOrigin: true,
    secure: true, // SSL sertifikasını doğrula
    pathRewrite: { "^/api": "/api" }, // URL'de /api'yi koru
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

// Statik dosyaları build klasöründen sun
app.use(express.static(path.join(__dirname, "build")));

// React Router'ın istemci tarafı yönlendirmesi için tüm diğer istekleri index.html'e yönlendir
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const port = 3001;
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
