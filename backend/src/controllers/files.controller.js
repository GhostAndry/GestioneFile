const path = require("path");
const fs = require("fs");
const db = require("../db");

console.log("✅ files.controller.js caricato");

const FilesController = {
    upload: (req, res) => {
        const file = req.file;
        const userId = req.user.id;

        if (!file)
            return res.status(400).json({ error: "Nessun file inviato" });

        const stmt = db.pool().prepare(`
            INSERT INTO files (user_id, filename, original_name, size, upload_date, download_id)
            VALUES (?, ?, ?, ?, NOW(), ?)
        `);

        const downloadId = Math.random().toString(36).substring(2, 12);

        stmt.execute([
            userId,
            file.filename,
            file.originalname,
            file.size,
            downloadId,
        ]);

        res.status(200).json({
            message: "Upload completato",
            download_id: downloadId,
        });
    },

    list: async (req, res) => {
        const userId = req.user.id;
        const [rows] = await db.query("SELECT * FROM files WHERE user_id = ?", [
            userId,
        ]);
        res.status(200).json(rows);
    },

    download: async (req, res) => {
        const downloadId = req.params.filename;
        const [rows] = await db.query(
            "SELECT * FROM files WHERE download_id = ?",
            [downloadId]
        );

        if (rows.length === 0)
            return res.status(404).json({ error: "File non trovato" });

        const file = rows[0];
        const filePath = path.join(
            __dirname,
            "..",
            "uploads",
            String(file.user_id),
            file.filename
        );

        if (!fs.existsSync(filePath))
            return res
                .status(404)
                .json({ error: "File non trovato sul server" });

        res.download(filePath, file.original_name);
    },
};

module.exports = FilesController;
