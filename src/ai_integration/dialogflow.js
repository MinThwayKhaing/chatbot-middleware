import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import dotenv from "dotenv";
dotenv.config();

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const languageCode = 'en-US';

const auth = new GoogleAuth({
  keyFile: keyFilePath,
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});


export async function getDialogflowResponse(message, userId) {
  if (!userId) {
    userId = `session-${Date.now()}`;
  }

  const sessionUrl = `https://dialogflow.googleapis.com/v2beta1/projects/${projectId}/agent/sessions/${userId}:detectIntent`;

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const requestBody = {
      queryInput: {
        text: {
          text: message,
          languageCode: languageCode
        }
      }
    };

    const response = await axios.post(sessionUrl, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`
      }
    });

    const result = response.data.queryResult;
    console.log('Dialogflow API response:', JSON.stringify(response.data, null, 2));

    const isFallback = result.intent?.isFallback || false;
    let replyText = "";

    // 1. Check knowledgeAnswers first
    if (result.knowledgeAnswers?.answers?.length > 0) {
      const bestAnswer = result.knowledgeAnswers.answers.reduce((prev, current) =>
        (prev.matchConfidence || 0) > (current.matchConfidence || 0) ? prev : current
      );
      console.log('Returning knowledge answer:', bestAnswer.answer);
      replyText = bestAnswer.answer;
    }

    // 2. Check fulfillmentMessages
    else if (result.fulfillmentMessages?.length > 0) {
      for (const message of result.fulfillmentMessages) {
        if (message?.text?.text?.length > 0) {
          console.log('Returning fulfillment message:', message.text.text[0]);
          replyText = message.text.text[0];
          break;
        }
      }
    }

    // 3. Check fulfillmentText
    else if (result.fulfillmentText?.trim()) {
      console.log('Returning fulfillment text:', result.fulfillmentText);
      replyText = result.fulfillmentText;
    }

    // If nothing found
    if (!replyText) {
      console.log('No response content, fallback.');
      replyText = "fallback";
    }

    return { replyText, isFallback };

  } catch (error) {
    console.error('Dialogflow API call error:', error.response ? error.response.data : error.message);
    return { replyText: "I'm having trouble processing your request. Please try again later.", isFallback: true };
  }
}
