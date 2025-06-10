// D:\dialogflow-server\src\utils\qnaHelpers.js
import { v2 } from '@google-cloud/dialogflow';

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const knowledgeBaseId = process.env.DIALOGFLOW_KNOWLEDGEBASE_ID; // Set this in your .env
const documentId = process.env.DIALOGFLOW_DOCUMENT_ID; // Set this too
const location = 'global';

const documentsClient = new v2.DocumentsClient();

const documentPath = `projects/${projectId}/locations/${location}/knowledgeBases/${knowledgeBaseId}/documents/${documentId}`;

/**
 * Get and parse the document content from Dialogflow knowledge base document.
 * Assumes plain text format (QnA pairs separated by linebreaks or a known structure).
 */
export async function fetchQnAFromKnowledgeDocument() {
  try {
    const [document] = await documentsClient.getDocument({ name: documentPath });

    const content = document.content || '';
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

    const qnaList = [];
    for (let i = 0; i < lines.length - 1; i += 2) {
      const userQuestion = lines[i];
      const botResponse = lines[i + 1];

      qnaList.push({
        id: Date.now() + i, // Unique ID, or you can hash userQuestion
        userQuestion,
        botResponse,
        includeWords: '', // You may add NLP keyword extraction here
        startWith: userQuestion.split(' ')[0]
      });
    }

    return qnaList;
  } catch (error) {
    console.error('Error fetching QnA from Dialogflow document:', error);
    return [];
  }
}
