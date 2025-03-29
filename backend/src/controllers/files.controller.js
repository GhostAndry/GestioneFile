const path = require("path");
const fs = require("fs");
const db = require("../db");

console.log("✅ files.controller.js caricato");

const FilesController = {
    upload: async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: "Nessun file inviato" });
            }

            const userId = req.user.id;

            const savedFiles = [];

            for (const file of req.files) {
                const downloadId = Math.random().toString(36).substring(2, 12);
                await db.query(
                    `
                    INSERT INTO files (user_id, filename, original_name, size, upload_date, download_id)
                    VALUES (?, ?, ?, ?, NOW(), ?)
                `,
                    [
                        userId,
                        file.filename,
                        file.originalname,
                        file.size,
                        downloadId,
                    ]
                );

                savedFiles.push({
                    original_name: file.originalname,
                    size: file.size,
                    download_id: downloadId,
                });
            }

            res.status(200).json(savedFiles);
        } catch (err) {
            console.error("❌ Upload error:", err.message);
            res.status(500).json({ error: "Errore interno" });
        }
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
            "/app/uploads",
            String(file.user_id),
            file.filename
        );

        console.log("filePath", filePath);
        console.log("file", file);

        if (!fs.existsSync(filePath))
            return res
                .status(404)
                .json({ error: "File non trovato sul server" });

        res.download(filePath, file.original_name);
    },
    delete: async (req, res) => {
        const downloadId = req.params.downloadId;
        const [rows] = await db.query(
            "SELECT * FROM files WHERE download_id = ?",
            [downloadId]
        );

        if (rows.length === 0)
            return res.status(404).json({ error: "File non trovato" });

        const file = rows[0];
        const filePath = path.join(
            "/app/uploads",
            String(file.user_id),
            file.filename
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.query("DELETE FROM files WHERE download_id = ?", [
            downloadId,
        ]);

        res.status(200).json({ message: "File eliminato con successo" });
    },

    rename: async (req, res) => {
        const downloadId = req.params.downloadId;
        const newName = req.body.newName;
    
        if (!newName) {
            return res.status(400).json({ error: "Nuovo nome mancante" });
        }
    
        const [rows] = await db.query(
            "SELECT * FROM files WHERE download_id = ?",
            [downloadId]
        );
    
        if (rows.length === 0)
            return res.status(404).json({ error: "File non trovato" });
        
        await db.query(
            "UPDATE files SET original_name = ? WHERE download_id = ?",
            [newName, downloadId]
        );
    
        res.status(200).json({ message: "Nome aggiornato con successo" });
    },
};

module.exports = FilesController;
