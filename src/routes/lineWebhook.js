import express from 'express';
import axios from 'axios';
import * as line from '@line/bot-sdk';
import { getDialogflowResponse } from '../ai_integration/dialogflow.js';
import { getGeminiResponse } from '../ai_integration/gemini.js';
import dotenv from "dotenv";
dotenv.config();


const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const router = express.Router();

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new line.Client(lineConfig);

router.post("/", async (req, res) => {
  try {
    
    const signature = req.headers['x-line-signature'];
    if (!line.validateSignature(JSON.stringify(req.body), process.env.LINE_CHANNEL_SECRET, signature)) {
      return res.status(401).send('Unauthorized');
    }

    const events = req.body.events;
    res.status(200).send('OK');
    console.log("events",events)
    for (const event of events) {
        console.log("events",events)
        if (event.type !== 'message' || event.message.type !== 'text') continue;
      
        const userId = event.source.userId;
        const message = event.message.text;
      
        let { replyText, isFallback } = await getDialogflowResponse(message, userId);
        console.log("Dialogflow says:", replyText, "| Fallback:", isFallback);
        
        if (isFallback) {
          replyText = await getGeminiResponse(message);
          console.log("Gemini says:", replyText);
        }
      
        await sendLinePush(userId, [
          { type: 'text', text: String(replyText) }
        ]);
     
      }
      

   
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const sendLinePush = async (userId, messages) => {
    const url = 'https://api.line.me/v2/bot/message/push';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
    };
  
    const body = {
      to: userId,
      messages: messages
    };
  
    try {
      const response = await axios.post(url, body, { headers });
      console.log('Line push API response:', response.data);
    } catch (error) {
      console.error('Error sending push message to LINE:', error.response?.data || error.message);
    }
  };
  

export default router;
