import express from "express";
import {
  getAgent,
  setAgent,
  deleteAgent,
  listAgents,
} from "../utils/agentHelpers.js";

const router = express.Router();

// GET /api/agent - Get agent config
router.get("/", async (req, res) => {
  try {
    const agent = await getAgent();
    res.json(agent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/agent - Create/Update agent
router.post("/", async (req, res) => {
  try {
    const agentPayload = req.body;
    const updatedAgent = await setAgent(agentPayload);
    res.json(updatedAgent);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/agent - "Deletes" agent by resetting config
router.delete("/", async (req, res) => {
  try {
    await deleteAgent();
    res.json({ message: "Agent config reset successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agent/list - List all agents (rarely used)
router.get("/list", async (req, res) => {
  try {
    const agents = await listAgents();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
