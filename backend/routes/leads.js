
const express = require("express");
const router = express.Router();

const {
    addLead,
    getAllLeads,
    getLeadById,
    updateLead,
    deleteLead
} = require("../controllers/leadController");

// Add a new lead
router.post("/", addLead);

// Get all leads
router.get("/", getAllLeads);

// Get one lead
router.get("/:id", getLeadById);

// Update a lead
router.put("/:id", updateLead);

// Delete a lead
router.delete("/:id", deleteLead);

module.exports = router;
