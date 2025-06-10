// D:\dialogflow-server\src\utils\categoryHelpers.js
import { v2 } from '@google-cloud/dialogflow';

const knowledgeBaseClient = new v2.KnowledgeBasesClient();
const documentsClient = new v2.DocumentsClient();

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const location = 'global';
const parent = `projects/${projectId}/locations/${location}`;

const kbEnabledMap = new Map();

/**
 * Fetches all knowledge bases and attaches enabled status.
 * @returns {Promise<Array>} List of knowledge bases with enabled status
 */

/**
 * Fetches a paginated list of knowledge bases with optional filtering.
 * @param {number} [pageSize=10] - Max number of items to return (default: 10, max: 100)
 * @param {string} [pageToken=null] - Token for the next page of results
 * @param {string} [filter=""] - Optional filter string
 * @returns {Promise<Object>} - An object with knowledgeBases list, nextPageToken
 */
export async function listKnowledgeBasesWithPagination(pageSize = 10, pageToken = null) {
  try {
    const request = {
      parent,
      pageSize,
      pageToken,
    };

    const [knowledgeBases, nextRequest, rawResponse] = await knowledgeBaseClient.listKnowledgeBases(request, {autoPaginate: false});

    const transformedKBs = knowledgeBases.map(kb => ({
      ...kb,
      enabled: kbEnabledMap.has(kb.name) ? kbEnabledMap.get(kb.name) : true,
    }));

    // Extract nextPageToken from rawResponse
    const nextPageToken = rawResponse?.nextPageToken || null;

    return {
      knowledgeBases: transformedKBs,
      nextPageToken,
    };
  } catch (error) {
    console.error('Error fetching paginated knowledge bases:', error);
    throw error;
  }
}




export async function listAllKnowledgeBases() {
    try {
      const [response] = await knowledgeBaseClient.listKnowledgeBases({ parent });
  
      // Attach enabled status from map or default true
      const kbList = response.map(kb => ({
        ...kb,
        enabled: kbEnabledMap.has(kb.name) ? kbEnabledMap.get(kb.name) : true,
      }));
  
      return kbList;
    } catch (error) {
      console.error('Error fetching Knowledge Bases:', error);
      throw error;
    }
  }
export async function createKnowledgeBase(displayName, enabled = true) {
  const request = {
    parent,
    knowledgeBase: {
      displayName,
      metadata: { enabled: enabled.toString() },
    },
  };
  const [response] = await knowledgeBaseClient.createKnowledgeBase(request);
  return { ...response, enabled };
}

export async function listKnowledgeBases() {
  const [response] = await knowledgeBaseClient.listKnowledgeBases({ parent });
  return response.map(kb => ({
    ...kb,
    enabled: kbEnabledMap.has(kb.name) ? kbEnabledMap.get(kb.name) : true,
  }));
}

export async function getKnowledgeBaseById(kbId) {
  const kbPath = `${parent}/knowledgeBases/${kbId}`;
  const [kb] = await knowledgeBaseClient.getKnowledgeBase({ name: kbPath });
  const enabled = kb.metadata?.enabled === 'true' || true;
  return { ...kb, enabled };
}

export async function updateKnowledgeBaseStatus(kbId, displayName) {
  const kbPath = `${parent}/knowledgeBases/${kbId}`;

  // Ensure it's a string and trimmed
  const safeDisplayName = String(displayName).trim();

  const [updatedKb] = await knowledgeBaseClient.updateKnowledgeBase({
    knowledgeBase: {
      name: kbPath,
      displayName: safeDisplayName,
    },
    updateMask: { paths: ['display_name'] },
  });

  return {
    ...updatedKb,
    displayName: updatedKb.displayName,
  };
}



export async function deleteKnowledgeBase(kbId) {
  const name = `${parent}/knowledgeBases/${kbId}`;
  await knowledgeBaseClient.deleteKnowledgeBase({ name });
  kbEnabledMap.delete(name);
  return true;
}
