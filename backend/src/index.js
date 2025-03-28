require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3001;

try {
    app.listen(PORT, () => {
        console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
} catch (err) {
    console.error("❌ Server crashed:", err);
}

process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection:", reason);
});
process.on("SIGINT", () => {
    console.log("🔌 Server shutting down...");
    process.exit(0);
});
process.on("SIGTERM", () => {
    console.log("🔌 Server shutting down...");
    process.exit(0);
});
process.on("SIGQUIT", () => {
    console.log("🔌 Server shutting down...");
    process.exit(0);
});
