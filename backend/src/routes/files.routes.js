const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const FilesController = require("../controllers/files.controller");

console.log("✅ files.routes.js caricato");

const SECRET = process.env.JWT_SECRET || "miniupload-secret";

// Middleware di verifica token
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

// Multer temporaneo
const upload = multer({ dest: "uploads/tmp" });

router.post("/upload", verifyToken, upload.single("file"), FilesController.upload);
router.get("/download/:filename", FilesController.download);

module.exports = router;
