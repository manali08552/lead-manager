
const db = require("../database/db");

// Allowed lead statuses
const allowedStatuses = ["New", "Contacted", "Qualified", "Lost"];

// 1. ADD NEW LEAD
exports.addLead = (req, res) => {
    const { name, email, phone, company, source, status } = req.body;

    // Required field validation
    if (!name || !email || !phone || !company || !source) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    // Status validation
    const leadStatus = status || "New";

    if (!allowedStatuses.includes(leadStatus)) {
        return res.status(400).json({
            message: "Invalid lead status"
        });
    }

    const sql = `
        INSERT INTO leads (name, email, phone, company, source, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name.trim(), email.trim(), phone.trim(), company.trim(), source, leadStatus],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Failed to add lead",
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Lead added successfully",
                leadId: this.lastID
            });
        }
    );
};

// 2. GET ALL LEADS
exports.getAllLeads = (req, res) => {
    const sql = "SELECT * FROM leads ORDER BY id DESC";

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch leads",
                error: err.message
            });
        }

        res.status(200).json(rows);
    });
};

// 3. GET SINGLE LEAD
exports.getLeadById = (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({
            message: "Invalid lead ID"
        });
    }

    db.get(
        "SELECT * FROM leads WHERE id = ?",
        [id],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    message: "Failed to fetch lead",
                    error: err.message
                });
            }

            if (!row) {
                return res.status(404).json({
                    message: "Lead not found"
                });
            }

            res.status(200).json(row);
        }
    );
};

// 4. UPDATE LEAD
exports.updateLead = (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, source, status } = req.body;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({
            message: "Invalid lead ID"
        });
    }

    if (!name || !email || !phone || !company || !source || !status) {
        return res.status(400).json({
            message: "All fields are required for updating a lead"
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid lead status"
        });
    }

    const sql = `
        UPDATE leads
        SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [name.trim(), email.trim(), phone.trim(), company.trim(), source, status, id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Failed to update lead",
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Lead not found"
                });
            }

            res.status(200).json({
                message: "Lead updated successfully"
            });
        }
    );
};

// 5. DELETE LEAD
exports.deleteLead = (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({
            message: "Invalid lead ID"
        });
    }

    db.run(
        "DELETE FROM leads WHERE id = ?",
        [id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    message: "Failed to delete lead",
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Lead not found"
                });
            }

            res.status(200).json({
                message: "Lead deleted successfully"
            });
        }
    );
};
