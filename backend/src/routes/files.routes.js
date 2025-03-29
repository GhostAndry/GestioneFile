const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/files.controller");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SECRET = process.env.JWT_SECRET || "miniupload-secret";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            String(req.user.id)
        );
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const randomName = Math.random().toString(36).substring(2, 12);
        cb(null, `${randomName}${ext}`);
    },
});

const upload = multer({ storage });

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

router.post(
    "/upload",
    verifyToken,
    upload.array("file"),
    FilesController.upload
);

router.post("/upload", verifyToken, upload.array("file"), FilesController.upload);
router.get("/list", verifyToken, FilesController.list);
router.get("/download/:filename", FilesController.download);
router.delete("/delete/:downloadId", verifyToken, FilesController.delete);
router.patch("/rename/:downloadId", verifyToken, FilesController.rename);

module.exports = router;
