const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET = process.env.JWT_SECRET || "miniupload-secret";

const AuthController = {
    register: (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const hashed = bcrypt.hashSync(password, 10);

        db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });

            const isAdmin = row.count === 0 ? 1 : 0;

            db.run(
                "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
                [username, hashed, isAdmin],
                function (err) {
                    if (err)
                        return res
                            .status(500)
                            .json({ error: "Username already exists" });

                    return res
                        .status(201)
                        .json({ id: this.lastID, username, is_admin: isAdmin });
                }
            );
        });
    },

    login: (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        db.get(
            "SELECT * FROM users WHERE username = ?",
            [username],
            (err, user) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!user)
                    return res
                        .status(401)
                        .json({ error: "Invalid credentials" });

                const valid = bcrypt.compareSync(password, user.password);
                if (!valid)
                    return res
                        .status(401)
                        .json({ error: "Invalid credentials" });

                const token = jwt.sign(
                    {
                        id: user.id,
                        username: user.username,
                        is_admin: !!user.is_admin,
                    },
                    SECRET,
                    { expiresIn: "2h" }
                );

                return res.status(200).json({ token });
            }
        );
    },
};

module.exports = AuthController;
