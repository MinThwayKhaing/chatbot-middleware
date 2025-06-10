import express from 'express';
import { getDialogflowResponse } from '../ai_integration/dialogflow.js';
import { getGeminiResponse } from '../ai_integration/gemini.js';

const router = express.Router();

router.get("/dialogflow-test", async (req, res) => {
  try {
    const reply = await getDialogflowResponse("What can you do?", "test-user");
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get Dialogflow response" });
  }
});

router.get("/gemini-test", async (req, res) => {
  try {
    const reply = await getGeminiResponse("Explain how AI works in a few words.");
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get Gemini AI response" });
  }
});

export default router;
