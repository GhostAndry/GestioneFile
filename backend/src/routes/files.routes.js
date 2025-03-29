const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/files.controller");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "miniupload-secret";

function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
    });
}

router.post("/upload", verifyToken, FilesController.upload);
router.get("/list", verifyToken, FilesController.list);
router.get("/download/:filename", FilesController.download);

module.exports = router;