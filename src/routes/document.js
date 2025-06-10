// src/routes/documents.js
import express from "express";
import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  parseCsvFromRawContent,
  deleteDocument,
} from "../utils/documentHelpers.js";

const router = express.Router();

// List documents for a knowledge base with optional pagination
router.get("/", async (req, res) => {
  try {
    const { kbId, pageSize = 10, pageToken = null } = req.query;
    if (!kbId) {
      return res.status(400).json({
        success: false,
        message: "Knowledge Base ID (kbId) is required",
      });
    }
    const { formattedData, nextPageToken } = await listDocuments(
      kbId,
      parseInt(pageSize),
      pageToken
    );
    res.json({ success: true, data: formattedData, nextPageToken });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to list documents",
      error: error.message,
    });
  }
});

// Get document by ID
router.get("/:kbId/:documentId", async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    const document = await getDocumentById(kbId, documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const faqs = parseCsvFromRawContent(document);
    console.log("Fetched document:", faqs); // for debugging
    res.json({ success: true, data: faqs });
  } catch (error) {
    console.error("Error fetching/parsing document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get document",
      error: error.message,
    });
  }
});

function generateCSV(questions) {
  return questions.map((q) => `${q.question},${q.answer}`).join("\n");
}

function base64Encode(text) {
  return Buffer.from(text, "utf-8").toString("base64");
}
router.post("/", async (req, res) => {
  try {
    const { kbId, displayName, questions } = req.body;

    if (!kbId || !displayName || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing kbId, displayName or questions",
      });
    }

    const csvContent = generateCSV(questions);
    const base64RawContent = base64Encode(csvContent);

    const documentPayload = {
      displayName,
      mimeType: "text/csv",
      knowledgeTypes: ["FAQ"],
      rawContent: base64RawContent,
    };

    const createdDoc = await createDocument(kbId, documentPayload);
    res
      .status(201)
      .json({ success: true, message: "Document created", data: createdDoc });
  } catch (error) {
    console.error("Document creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Create document failed",
      error: error.message,
    });
  }
});
// Update a document with same structure as creation
router.put("/:kbId/:documentId", async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    const { displayName, questions } = req.body;

    if (
      !kbId ||
      !documentId ||
      !displayName ||
      !questions ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing kbId, documentId, displayName or questions",
      });
    }

    const csvContent = generateCSV(questions);
    const base64RawContent = base64Encode(csvContent);

    const updatePayload = {
      displayName,
      rawContent: base64RawContent,
    };

    const updateMaskPaths = ["displayName", "rawContent"];

    const updatedDoc = await updateDocument(
      kbId,
      documentId,
      updatePayload,
      updateMaskPaths
    );

    res.json({ success: true, message: "Document updated", data: updatedDoc });
  } catch (error) {
    console.error("Document update failed:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
});

// Delete a document
router.delete("/:kbId/:documentId", async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    await deleteDocument(kbId, documentId);
    res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Delete failed", error: error.message });
  }
});

export default router;
