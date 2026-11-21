
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import lead routes
const leadRoutes = require("./routes/leads");

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Lead Manager API is running successfully"
    });
});

// Lead API routes
app.use("/api/leads", leadRoutes);

// Server port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
