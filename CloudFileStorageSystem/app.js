const dns = require("dns");

// =============================
// Fix MongoDB SRV DNS resolution
// =============================
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");

// =============================
// Load environment variables FIRST
// =============================
dotenv.config();

// =============================
// Routes
// =============================
const uploadRoute = require("./routes/upload");
const authRoute = require("./routes/auth");

const app = express();

// =============================
// MongoDB
// =============================
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.log("❌ MongoDB Connection Error:", error.message);
    });

// =============================
// Middleware
// =============================
app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    session({
        secret: "cloudstorage_secret_key",
        resave: false,
        saveUninitialized: false
    })
);

// =============================
// Static Files
// =============================
app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// =============================
// API Routes
// =============================
app.use("/auth", authRoute);

app.use("/upload", uploadRoute);

// =============================
// Pages
// =============================
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.get("/login", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

app.get("/register", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "register.html")
    );
});

app.get("/dashboard", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "dashboard.html")
    );
});

// =============================
// Test
// =============================
app.get("/test", (req, res) => {
    res.send(
        "Cloud File Storage System is Running!"
    );
});

// =============================
// Server
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );
});