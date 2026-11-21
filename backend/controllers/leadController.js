
const db = require("../database/db");

const allowedStatuses = ["New", "Contacted", "Qualified", "Lost"];

const allowedSources = [
    "Website",
    "LinkedIn",
    "Referral",
    "Advertisement",
    "Other"
];

function validateLeadInput(body, requireStatus = false) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "";

    const status = requireStatus
        ? body.status
        : (body.status || "New");

    if (!name || !email || !phone || !company || !source) {
        return { error: "All fields are required" };
    }

    if (name.length > 100 || company.length > 120) {
        return { error: "Name or company name is too long" };
    }

    if (email.length > 254) {
        return { error: "Email address is too long" };
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        return { error: "Please enter a valid email address" };
    }

    // Exactly 10 digits required
    const phonePattern = /^\d{10}$/;

    if (!phonePattern.test(phone)) {
        return {
            error: "Phone number must contain exactly 10 digits"
        };
    }

    if (!allowedSources.includes(source)) {
        return { error: "Invalid lead source" };
    }

    if (!allowedStatuses.includes(status)) {
        return { error: "Invalid lead status" };
    }

    return {
        values: {
            name,
            email,
            phone,
            company,
            source,
            status
        }
    };
}

function isValidId(id) {
    return /^\d+$/.test(id) &&
        Number(id) > 0 &&
        Number.isSafeInteger(Number(id));
}

// ADD NEW LEAD
exports.addLead = (req, res) => {
    const validation = validateLeadInput(req.body || {});

    if (validation.error) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const { name, email, phone, company, source, status } = validation.values;

    const sql = `
        INSERT INTO leads (name, email, phone, company, source, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, email, phone, company, source, status],
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

// GET ALL LEADS
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

// GET SINGLE LEAD
exports.getLeadById = (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
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

// UPDATE LEAD
exports.updateLead = (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(400).json({
            message: "Invalid lead ID"
        });
    }

    const validation = validateLeadInput(req.body || {}, true);

    if (validation.error) {
        return res.status(400).json({
            message: validation.error
        });
    }

    const { name, email, phone, company, source, status } = validation.values;

    const sql = `
        UPDATE leads
        SET name = ?, email = ?, phone = ?, company = ?, source = ?, status = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [name, email, phone, company, source, status, id],
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

// DELETE LEAD
exports.deleteLead = (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
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
