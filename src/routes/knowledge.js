import express from 'express';
import { v2 } from '@google-cloud/dialogflow';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const knowledgeBaseClient = new v2.KnowledgeBasesClient();
const documentsClient = new v2.DocumentsClient();

const parent = `projects/${projectId}/locations/global`;

// 🔄 List Knowledge Bases
router.get('/bases', async (req, res) => {
  try {
    const [results] = await knowledgeBaseClient.listKnowledgeBases({ parent });
    res.json({
      success: true,
      message: 'Knowledge bases retrieved successfully',
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge bases',
      error: error.message,
    });
  }
});

// ➕ Create a Knowledge Base
router.post('/bases', async (req, res) => {
  try {
    const { displayName } = req.body;
    const [kb] = await knowledgeBaseClient.createKnowledgeBase({
      parent,
      knowledgeBase: { displayName },
    });
    res.status(201).json({
      success: true,
      message: 'Knowledge base created',
      data: kb,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create knowledge base',
      error: error.message,
    });
  }
});

// 📄 List Documents in a Knowledge Base
router.get('/bases/:kbId/documents', async (req, res) => {
  try {
    const kbPath = `${parent}/knowledgeBases/${req.params.kbId}`;
    const [docs] = await documentsClient.listDocuments({ parent: kbPath });
    res.json({
      success: true,
      message: 'Documents retrieved successfully',
      data: docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message,
    });
  }
});

// 📥 Create a Document (from GCS URI)
router.post('/bases/:kbId/documents', async (req, res) => {
  try {
    const { displayName, contentUri } = req.body;
    const parentKb = `${parent}/knowledgeBases/${req.params.kbId}`;

    const request = {
      parent: parentKb,
      document: {
        displayName,
        mimeType: 'text/html', // or 'text/csv'
        knowledgeTypes: ['FAQ'],
        contentUri, // e.g., gs://bucket-name/faq.txt
      },
    };

    const [operation] = await documentsClient.createDocument(request);
    const [response] = await operation.promise();

    res.status(201).json({
      success: true,
      message: 'Document created',
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create document',
      error: error.message,
    });
  }
});

// ❌ Delete a Document
router.delete('/documents/:docId', async (req, res) => {
  try {
    const kbId = req.query.kbId;
    const docId = req.params.docId;

    const docName = `${parent}/knowledgeBases/${kbId}/documents/${docId}`;
    const [operation] = await documentsClient.deleteDocument({ name: docName });
    await operation.promise();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
});

export default router;
