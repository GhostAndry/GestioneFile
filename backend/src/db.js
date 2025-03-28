const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// 📁 Crea la cartella "db" se non esiste
const dbDir = path.join(__dirname, "..", "db");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "miniupload.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("❌ DB Error:", err.message);
    console.log("✅ SQLite connected");
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            is_admin INTEGER DEFAULT 0
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            original_name TEXT,
            size INTEGER,
            upload_date TEXT,
            download_id TEXT UNIQUE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
});

module.exports = db;
