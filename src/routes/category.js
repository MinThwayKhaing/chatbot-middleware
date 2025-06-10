// backend/routes/category.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import {
  createKnowledgeBase,
  listKnowledgeBases,
  getKnowledgeBaseById,
  updateKnowledgeBaseStatus,
  deleteKnowledgeBase,
  listKnowledgeBasesWithPagination,
} from "../../src/utils/categoryHelpers.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const pageSize = parseInt(req.query.pageSize) || 10;
    const pageToken = req.query.pageToken || null;
    const filter = req.query.filter || "";

    // Call your existing function WITHOUT sending filter param to API
    const response = await listKnowledgeBasesWithPagination(
      pageSize,
      pageToken
    );

    // Server-side filter here — case-insensitive filter by displayName
    let knowledgeBases = response.knowledgeBases;
    if (filter && filter.trim() !== "") {
      const filterLower = filter.toLowerCase();
      knowledgeBases = knowledgeBases.filter((kb) =>
        kb.displayName.toLowerCase().includes(filterLower)
      );
    }

    // Format response data exactly as you showed
    const formattedData = knowledgeBases.map((kb) => ({
      name: kb.displayName,
      id: kb.name.split("/").pop(),
      displayName: kb.displayName,
      languageCode: kb.languageCode || "en-US", // fallback if missing
      enabled: kb.enabled,
    }));

    res.json({
      success: true,
      message: "Paginated Knowledge Bases retrieved successfully",
      data: formattedData,
      nextPageToken: response.nextPageToken || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Pagination fetch failed",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const kbList = await listKnowledgeBases();

    // Map and transform the response items
    const transformedList = kbList.map((kb) => ({
      name: kb.displayName,
      id: kb.name.split("/").pop(), // Extract the last part as id
      languageCode: kb.languageCode,
      enabled: kb.enabled,
    }));

    res.json({
      success: true,
      message: "Knowledge Bases retrieved successfully",
      data: transformedList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch knowledge bases",
      error: error.message,
    });
  }
});

// --- New endpoints using Dialogflow KB helpers ---

// Create KB
router.post("/", async (req, res) => {
  try {
    const { name, enabled = true } = req.body;
    const kb = await createKnowledgeBase(name, enabled);
    res
      .status(201)
      .json({ success: true, message: "Knowledge Base created", data: kb });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Create failed", error: error.message });
  }
});

// Get single KB
router.get("/:id", async (req, res) => {
  try {
    const kb = await getKnowledgeBaseById(req.params.id);
    res.json({ success: true, message: "Knowledge Base retrieved", data: kb });
  } catch (error) {
    res
      .status(404)
      .json({ success: false, message: "Not found", error: error.message });
  }
});

// Update KB status
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const updatedKb = await updateKnowledgeBaseStatus(req.params.id, name);
    res.json({
      success: true,
      message: "Knowledge Base updated",
      data: updatedKb,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Update failed", error: error.message });
  }
});

// Delete KB
router.delete("/:id", async (req, res) => {
  try {
    await deleteKnowledgeBase(req.params.id);
    res.json({ success: true, message: "Knowledge Base deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Delete failed", error: error.message });
  }
});

export default router;
