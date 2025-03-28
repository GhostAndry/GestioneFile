console.log("🧪 dentro app.js");

const express = require("express");
const cors = require("cors");

console.log("✅ express & cors importati");

const authRoutes = require("./routes/auth.routes");
console.log("✅ auth.routes importato");

const fileRoutes = require("./routes/files.routes");
console.log("✅ files.routes importato");

const app = express();

console.log("✅ express app inizializzata");

app.use(cors());
app.use(express.json());

console.log("✅ middleware caricati");

app.use("/auth", authRoutes);
console.log("✅ auth.routes montato");

app.use("/files", fileRoutes);
console.log("✅ files.routes montato");

console.log("✅ app pronta");

module.exports = app;
