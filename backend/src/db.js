const mysql = require("mysql2/promise");

const {
    DB_HOST = "miniuploaddb",
    DB_PORT = 3306,
    DB_USER = "root",
    DB_PASSWORD = "root",
    DB_NAME = "miniupload_db"
} = process.env;

let pool;

async function waitForDB(retries = 20, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const conn = await mysql.createConnection({
                host: DB_HOST,
                port: DB_PORT,
                user: DB_USER,
                password: DB_PASSWORD
            });
            await conn.query(`USE ${DB_NAME}`);
            await conn.end();
            console.log("✅ MariaDB is ready");
            return;
        } catch (err) {
            console.log(`⏳ Waiting for MariaDB... (${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    console.error("❌ MariaDB not reachable. Giving up.");
    process.exit(1);
}

(async () => {
    await waitForDB();

    try {
        pool = await mysql.createPool({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("✅ MariaDB connected");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                password TEXT,
                is_admin TINYINT DEFAULT 0
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                filename TEXT,
                original_name TEXT,
                size INT,
                upload_date DATETIME,
                download_id VARCHAR(255) UNIQUE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log("✅ Tables created");
    } catch (err) {
        console.error("❌ DB Error:", err.message);
        process.exit(1);
    }
})();

process.on("SIGINT", async () => {
    console.log("👋 Closing MariaDB pool...");
    if (pool) await pool.end();
    process.exit(0);
});

module.exports = {
    query: (...args) => pool.query(...args),
    pool: () => pool
};
