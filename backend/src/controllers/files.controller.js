const path = require("path");
const fs = require("fs");
const db = require("../db");

console.log("✅ files.controller.js caricato");

const FilesController = {
    upload: async (req, res) => {
        try {
            console.log("🔥 Upload triggered");

            const userId = req.user.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: "Nessun file caricato" });
            }

            const downloadId = Math.random().toString(36).substring(2, 10);
            const now = new Date();

            await db.query(`
                INSERT INTO files (user_id, filename, original_name, size, upload_date, download_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                userId,
                file.filename,
                file.originalname,
                file.size,
                now,
                downloadId
            ]);

            return res.status(200).json({
                message: "✅ Upload completato",
                download_id: downloadId
            });
        } catch (err) {
            console.error("❌ Upload error:", err.message);
            return res.status(500).json({ error: "Errore durante l'upload" });
        }
    },

    download: async (req, res) => {
        try {
            console.log("📥 Download richiesto");

            const { download_id } = req.params;

            const [rows] = await db.query(`
                SELECT * FROM files WHERE download_id = ?
            `, [download_id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: "File non trovato" });
            }

            const file = rows[0];
            const filePath = path.join(__dirname, "..", "..", "uploads", String(file.user_id), file.filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: "File non presente su disco" });
            }

            res.download(filePath, file.original_name);
        } catch (err) {
            console.error("❌ Download error:", err.message);
            return res.status(500).json({ error: "Errore durante il download" });
        }
    }
};

module.exports = FilesController;
