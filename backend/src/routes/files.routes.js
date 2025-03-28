const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/files.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "miniupload-secret";

// Middleware per verificare il token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

// Storage Multer dinamico per user_id
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, "..", "..", "uploads", String(req.user.id));
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // filename casuale + estensione originale
        const ext = path.extname(file.originalname);
        const randomName = Math.random().toString(36).substring(2, 12);
        cb(null, `${randomName}${ext}`);
    }
});

const upload = multer({ storage });

router.post("/upload", verifyToken, upload.single("file"), FilesController.upload);
router.get("/download/:filename", FilesController.download);

module.exports = router;
