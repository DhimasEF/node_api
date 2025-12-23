const express = require('express');
const app = express();
const PORT = 3000;
const cors = require("cors");
const db = require("./config/db"); // 🔥 INI WAJIB
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use((req, res, next) => {
  req.requestId = uuidv4();
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 CLIENT CONTEXT (DARI FLUTTER HEADER)
app.use((req, res, next) => {
  req.context = {
    ip: req.headers["x-client-ip"] || "unknown",
    device: req.headers["x-client-device"] || "unknown",
    platform: req.headers["x-client-platform"] || "unknown",
  };
  next();
});


app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/uploads')) {
    return next();
  }

  const { ip, device, platform } = req.context;
  const method = req.method;
  const endpoint = req.originalUrl;

  logger.info(
    `request_id=${req.requestId} ip=${ip} device=${device} platform=${platform} method=${method} endpoint=${endpoint}`
  );

  next();
});


//routes
const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const profilRoutes = require('./routes/profil.routes');
app.use('/profil', profilRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/user", userRoutes);

// Static folder untuk avatar
app.use('/uploads', express.static(__dirname + '/uploads'));

const artworkRoutes = require("./routes/artwork.routes");
app.use("/artwork", artworkRoutes);

const orderRoutes = require("./routes/order.routes");
app.use("/order", orderRoutes);


// route default
app.get('/', (req, res) => {
  res.json({ message: 'API Node.js berjalan menggunakan app.js!' });
});

// 🔥 health check DB (TIDAK PERLU FILE TERPISAH)
app.get("/health/db", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) {
      return res.json({ db: false, error: err.message });
    }
    res.json({ db: true });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan pada port ${PORT}`);
});

