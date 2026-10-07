require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const alertRoutes = require("./routes/alertRoutes");
const sensorRoutes = require("./routes/sensorRoutes");

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "OK" : "ERROR",
    database: databaseConnected ? "connected" : "disconnected"
  });
});
app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error("API error:", error.message);
  res.status(500).json({ message: "Server error. Check that MongoDB is running and try again." });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Copy .env.example to .env and configure it.");
    process.exitCode = 1;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB.");
    app.listen(port, () => console.log(`Smart Bag API listening at http://localhost:${port}`));
  } catch (error) {
    console.error(`Could not connect to MongoDB: ${error.message}`);
    process.exitCode = 1;
  }
}

startServer();
