import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getOpenAIResponse(userMessage) {
  const instructions = "You are a helpful and friendly assistant.";

  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: instructions },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content;
}
