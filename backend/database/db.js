
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Store database inside the backend/database folder
const dbPath = path.join(__dirname, "leads.db");

// Create or connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database successfully");
    }
});

// Create leads table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            company TEXT NOT NULL,
            source TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'New'
                CHECK(status IN ('New', 'Contacted', 'Qualified', 'Lost')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error("Error creating leads table:", err.message);
        } else {
            console.log("Leads table created successfully");
        }
    });
});

module.exports = db;
