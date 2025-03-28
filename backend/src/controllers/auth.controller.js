const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

console.log("✅ auth.controller.js caricato");

const SECRET = process.env.JWT_SECRET || "miniupload-secret";

const AuthController = {
    register: async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        try {
            const hashed = bcrypt.hashSync(password, 10);

            const [users] = await db.query("SELECT COUNT(*) as count FROM users");
            const isAdmin = users[0].count === 0 ? 1 : 0;

            await db.query(
                "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                [username, hashed, isAdmin]
            );

            const [userRow] = await db.query("SELECT id FROM users WHERE username = ?", [username]);

            return res.status(201).json({
                id: userRow[0].id,
                username,
                is_admin: isAdmin
            });
        } catch (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ error: "Username already exists" });
            }
            console.error("❌ Register Error:", err.message);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    login: async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        try {
            const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

            if (users.length === 0) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const user = users[0];
            const valid = bcrypt.compareSync(password, user.password);
            if (!valid) return res.status(401).json({ error: "Invalid credentials" });

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    is_admin: !!user.is_admin
                },
                SECRET,
                { expiresIn: "2h" }
            );

            return res.status(200).json({ token });
        } catch (err) {
            console.error("❌ Login Error:", err.message);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
};

module.exports = AuthController;
