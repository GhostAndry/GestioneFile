const express = require("express");
const cors = require("cors");
const app = express();

const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/files.routes");

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/files", fileRoutes);

module.exports = app;
