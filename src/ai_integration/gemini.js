import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Gemini client
const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// Function to get a Gemini AI response with strict token limits
export async function getGeminiResponse(userMessage) {
  try {
    
    const model = ai.getGenerativeModel({
      model:  "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.7,
      },
    });
    const prompt = `${userMessage}\n\nPlease respond in 10 words or less.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    console.log("Reach here",text)
    // Sanitize output: remove newlines and trim
    text = text.replace(/\n/g, ' ').trim();

    // Fallback truncation if too long
    const words = text.split(/\s+/);
    if (words.length > 10) {
      return words.slice(0, 10).join(' ') + '...';
    }
    
    return text || "No response.";
  } catch (err) {
    console.error("Error getting Gemini response:", err);
    return "Failed to get response from Gemini AI.";
  }
  
}
async function listAvailableModels() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    console.log("Available models:", response.data.models);
  } catch (error) {
    console.error("Error listing models:", error.response?.data || error.message);
  }
}

