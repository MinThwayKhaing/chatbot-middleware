import { v2 } from '@google-cloud/dialogflow';

const documentsClient = new v2.DocumentsClient();

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = 'global'; // or your location
const parentBase = `projects/${projectId}/locations/${location}/knowledgeBases`;

/**
 * List all documents in a knowledge base (paginated).
 * @param {string} kbId - Knowledge Base ID
 * @param {number} pageSize
 * @param {string} pageToken
 * @returns {Promise<{documents: Array, nextPageToken: string}>}
 */
export async function listDocuments(kbId, pageSize = 10, pageToken = null) {
  const parent = `${parentBase}/${kbId}`;
  const request = {
    parent,
    pageSize,
    pageToken,
  };
  const [response] = await documentsClient.listDocuments(request);


  const formattedData = response.map(kb => ({
    name: kb.displayName,
    id: kb.name.split('/').pop(), 
    knowledgeTypes: kb.knowledgeTypes,
    languageCode: kb.languageCode || 'en-US',  // fallback if missing
  }));

console.log("formattedData",formattedData)


  return {
    formattedData,
    nextPageToken: response.nextPageToken || null,
  };
}

/**
 * Get document by ID
 * @param {string} kbId
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function getDocumentById(kbId, documentId) {
  const name = `${parentBase}/${kbId}/documents/${documentId}`;
  const [document] = await documentsClient.getDocument({ name });
  return document;
}

/**
 * Create a new document in a knowledge base
 * @param {string} kbId
 * @param {Object} documentPayload - must include displayName and contentUri or rawContent
 * @returns {Promise<Object>}
 */
export async function createDocument(kbId, documentPayload) {
  const parent = `${parentBase}/${kbId}`;
  const request = {
    parent,
    document: documentPayload,
  };
  const [operation] = await documentsClient.createDocument(request);
  const [response] = await operation.promise(); // wait for creation to complete
  return response;
}

/**
 * Update a document
 * @param {string} kbId
 * @param {string} documentId
 * @param {Object} updatePayload
 * @param {string[]} updateMaskPaths - which fields to update
 * @returns {Promise<Object>}
 */
export async function updateDocument(kbId, documentId, updatePayload, updateMaskPaths) {
  const name = `${parentBase}/${kbId}/documents/${documentId}`;
  const request = {
    document: {
      name,
      ...updatePayload,
    },
    updateMask: { paths: updateMaskPaths },
  };
  const [updatedDocument] = await documentsClient.updateDocument(request);
  return updatedDocument;
}

/**
 * Delete a document
 * @param {string} kbId
 * @param {string} documentId
 * @returns {Promise<void>}
 */
export async function deleteDocument(kbId, documentId) {
  const name = `${parentBase}/${kbId}/documents/${documentId}`;
  await documentsClient.deleteDocument({ name });
  return;
}
