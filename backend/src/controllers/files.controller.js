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
                    INSERT INTO files (
                        user_id, filename, original_name, size, upload_date, download_id,
                        is_shared, shared_mode, shared_with
                    ) VALUES (?, ?, ?, ?, NOW(), ?, false, NULL, NULL)
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
            console.log(
                `📂 File caricati con successo per l'utente ${userId}:`,
                savedFiles
            );
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
        console.log(`📂 Files List for id ${userId}:`, rows);
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

        if (!fs.existsSync(filePath))
            return res
                .status(404)
                .json({ error: "File non trovato sul server" });

        console.log("📂 File path:", filePath);
        console.log("📂 File data:", file);
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

        await db.query("DELETE FROM files WHERE download_id = ?", [downloadId]);

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

    getSharedFile: async (req, res) => {
        const { download_id } = req.params;
        let username = null;

        const authHeader = req.headers["authorization"];
        console.log("📜 Header di autorizzazione:", authHeader);
        if (authHeader) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, SECRET);
                username = decoded.username;
                console.log("✅ Username nel token:", username);
            } catch (err) {
                console.warn("⚠️ Token non valido o scaduto");
            }
        }

        try {
            const [rows] = await db.query(
                "SELECT * FROM files WHERE download_id = ?",
                [download_id]
            );
            if (!rows || rows.length === 0) {
                return res.status(404).json({ message: "File non trovato" });
            }

            const file = rows[0];

            if (!file.is_shared) {
                return res.status(403).json({ message: "File non condiviso" });
            }

            if (file.shared_mode === "private") {
                const allowed = JSON.parse(file.shared_with || "[]");
                console.log("📜 Utenti autorizzati:", allowed);

                if (!username) {
                    console.warn(
                        "⚠️ Nessun username nel token, accesso negato"
                    );
                    return res.status(403).json({ message: "Accesso negato" });
                }

                const normalizedAllowed = allowed
                    .map((u) => u?.toLowerCase?.())
                    .filter(Boolean);

                if (!normalizedAllowed.includes(username.toLowerCase())) {
                    console.warn(
                        "⚠️ Username non presente tra gli autorizzati:",
                        username,
                        normalizedAllowed
                    );
                    return res.status(403).json({ message: "Accesso negato" });
                }
            }

            const filePath = path.join(
                "/app/uploads",
                String(file.user_id),
                file.filename
            );

            if (!fs.existsSync(filePath)) {
                return res
                    .status(404)
                    .json({ message: "File mancante sul server" });
            }

            return res.download(filePath, file.original_name);
        } catch (err) {
            console.error("❌ Errore getSharedFile:", err);
            res.status(500).json({ message: "Errore interno del server" });
        }
    },

    updateSharing: async (req, res) => {
        const { downloadId } = req.params;
        const { is_shared, shared_mode, shared_with } = req.body;
        const userId = req.user.id;

        try {
            const [rows] = await db.query(
                "SELECT * FROM files WHERE download_id = ? AND user_id = ?",
                [downloadId, userId]
            );

            if (rows.length === 0) {
                return res
                    .status(404)
                    .json({ error: "File non trovato o non autorizzato" });
            }

            let sharedWithJson = null;
            if (shared_mode === "private" && Array.isArray(shared_with)) {
                const [rows] = await db.query(
                    `SELECT username FROM users WHERE username IN (${shared_with
                        .map(() => "?")
                        .join(",")})`,
                    shared_with
                );

                const validUsernames = rows.map((row) => row.username);
                sharedWithJson = JSON.stringify(validUsernames);
            }

            await db.query(
                "UPDATE files SET is_shared = ?, shared_mode = ?, shared_with = ? WHERE download_id = ?",
                [is_shared, shared_mode || null, sharedWithJson, downloadId]
            );

            res.status(200).json({
                message: "Condivisione aggiornata con successo",
            });
        } catch (err) {
            console.error("❌ updateSharing error:", err.message);
            res.status(500).json({ error: "Errore interno del server" });
        }
    },
};

module.exports = FilesController;
