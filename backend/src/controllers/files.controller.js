const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const db = require("../db");

function generateDownloadId() {
    return crypto.randomBytes(6).toString("hex"); // tipo "4f9c2a6e4d91"
}

const FilesController = {
    upload: (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;
        const now = new Date().toISOString();
        const downloadId = generateDownloadId();

        db.run(
            `
            INSERT INTO files (user_id, filename, original_name, size, upload_date, download_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
            [
                req.user.id,
                file.originalname,
                file.originalname,
                file.size,
                now,
                downloadId,
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                return res.status(201).json({
                    id: this.lastID,
                    filename: file.originalname,
                    size: file.size,
                    download_url: `/files/download/${downloadId}`,
                });
            }
        );
    },

    download: (req, res) => {
        const { filename } = req.params;

        db.get(
            "SELECT * FROM files WHERE download_id = ?",
            [filename],
            (err, file) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!file)
                    return res.status(404).json({ error: "File not found" });

                const filePath = path.join(
                    __dirname,
                    "..",
                    "..",
                    "uploads",
                    String(file.user_id),
                    file.original_name
                );
                if (!fs.existsSync(filePath)) {
                    return res
                        .status(404)
                        .json({ error: "File does not exist on disk" });
                }

                res.download(filePath, file.original_name);
            }
        );
    },
};

module.exports = FilesController;
