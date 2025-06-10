// src/routes/documents.js
import express from 'express';
import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../utils/documentHelpers.js';

const router = express.Router();

// List documents for a knowledge base with optional pagination
router.get('/', async (req, res) => {
  try {
    const { kbId, pageSize = 10, pageToken = null } = req.query;
    if (!kbId) {
      return res.status(400).json({ success: false, message: 'Knowledge Base ID (kbId) is required' });
    }
    const { formattedData, nextPageToken } = await listDocuments(kbId, parseInt(pageSize), pageToken);
    res.json({ success: true, data: formattedData, nextPageToken });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list documents', error: error.message });
  }
});

// Get document by ID
router.get('/:kbId/:documentId', async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    const document = await getDocumentById(kbId, documentId);
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Document not found', error: error.message });
  }
});

// Create a new document
router.post('/', async (req, res) => {
  try {
    const { kbId, ...documentPayload } = req.body;
    if (!kbId) {
      return res.status(400).json({ success: false, message: 'Knowledge Base ID (kbId) is required' });
    }
    if (!documentPayload.displayName) {
      return res.status(400).json({ success: false, message: 'displayName is required' });
    }
    if (!documentPayload.mimeType) {
      return res.status(400).json({ success: false, message: 'mimeType is required' });
    }
    if (!documentPayload.contentUri && !documentPayload.rawContent) {
      return res.status(400).json({ success: false, message: 'Either contentUri or rawContent must be provided' });
    }

    const createdDoc = await createDocument(kbId, documentPayload);
    res.status(201).json({ success: true, message: 'Document created', data: createdDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Create document failed', error: error.message });
  }
});

// Update a document
router.put('/:kbId/:documentId', async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    const updatePayload = req.body;
    const updateMaskPaths = Object.keys(updatePayload);

    if (!updateMaskPaths.length) {
      return res.status(400).json({ success: false, message: 'No fields to update provided' });
    }

    const updatedDoc = await updateDocument(kbId, documentId, updatePayload, updateMaskPaths);
    res.json({ success: true, message: 'Document updated', data: updatedDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// Delete a document
router.delete('/:kbId/:documentId', async (req, res) => {
  try {
    const { kbId, documentId } = req.params;
    await deleteDocument(kbId, documentId);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
});

export default router;