const express = require('express');
const app = express();
const PORT = 3000;
const cors = require("cors");
const db = require("./config/db");
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

/* =========================
   APP CONFIG
========================= */
app.set("appName", "Art Store");

/* =========================
   MIDDLEWARE DASAR
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   REQUEST ID
========================= */
app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

/* =========================
   CLIENT CONTEXT
========================= */
app.use((req, res, next) => {
  req.clientContext = {
    ip: req.headers["x-client-ip"] || req.ip,
    device: req.headers["x-client-device"] || "unknown",
    platform: req.headers["x-client-platform"] || "unknown",
  };
  next();
});

/* =========================
   SERVER CONTEXT
========================= */
app.use((req, res, next) => {
  req.serverContext = {
    headers: { ...req.headers },
    user_agent: req.headers["user-agent"] || null,
    host: req.headers.host || null,
    referer: req.headers.referer || null,
    ip_address: req.ip
  };

  delete req.serverContext.headers.authorization;
  delete req.serverContext.headers.cookie;

  next();
});

/* =========================
   🔥 GLOBAL API RESPONSE HELPER (WAJIB)
========================= */
app.use((req, res, next) => {
  res.apiResponse = (data = {}, statusCode = 200) => {
    res.status(statusCode).json({
      status: statusCode >= 200 && statusCode < 300,

      message: data.message || null,
      token: data.token || null,
      user: data.user || null,
      data: data.data ?? data ?? null,

      meta: {
        app: req.app.get("appName"),
        request_id: req.requestId,
        timestamp: new Date().toISOString(),

        endpoint: {
          full: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          method: req.method,
          params: req.params || {},
          query: req.query || {}
        },

        payload: {
          params: req.params || {},
          query: req.query || {},
          body: ["POST", "PUT", "PATCH"].includes(req.method) ? req.body : {}
        },

        server_response: req.serverContext
      }
    });
  };

  next();
});

/* =========================
   🔥 REQUEST & RESPONSE LOGGER
========================= */
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/uploads')) return next();

  const startTime = Date.now();

  logger.info({
    type: "REQUEST",
    request_id: req.requestId,
    app: req.app.get("appName"),

    endpoint: {
      full: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method
    },

    payload: {
      params: req.params || {},
      query: req.query || {},
      body: ["POST", "PUT", "PATCH"].includes(req.method) ? req.body : {}
    },

    client: req.clientContext,
    server_request: req.serverContext
  });

  const originalJson = res.json;
  res.json = function (body) {
    logger.info({
      type: "RESPONSE",
      request_id: req.requestId,
      app: req.app.get("appName"),
      status_code: res.statusCode,
      duration_ms: Date.now() - startTime,
      apiResponse: body,
      server_response: { headers: res.getHeaders() }
    });

    return originalJson.call(this, body);
  };

  next();
});

/* =========================
   ROUTES
========================= */
app.use("/auth", require("./routes/auth.routes"));
app.use("/profil", require("./routes/profil.routes"));
app.use("/user", require("./routes/user.routes"));
app.use("/artwork", require("./routes/artwork.routes"));
app.use("/order", require("./routes/order.routes"));

/* =========================
   STATIC FILES
========================= */
app.use('/uploads', express.static(__dirname + '/uploads'));

/* =========================
   DEFAULT ROUTE
========================= */
app.get('/', (req, res) => {
  res.apiResponse({ message: "API Art Store berjalan" });
});

/* =========================
   DB HEALTH CHECK
========================= */
app.get("/health/db", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.apiResponse({ db: false, error: err.message }, 500);
    }
    res.apiResponse({ db: true });
  });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
