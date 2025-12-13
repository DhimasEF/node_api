const express = require('express');
const app = express();
const PORT = 3000;
const cors = require("cors");

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept"
  ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route default
app.get('/', (req, res) => {
  res.json({ message: 'API Node.js berjalan menggunakan app.js!' });
});

// start server
app.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
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