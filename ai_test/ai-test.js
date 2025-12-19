import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const response = await genai.models.generateContent({
  model: 'gemini-2.0-flash',
  config: {},
  contents: 'Olá tudo bem?',
});

console.log(response.candidates[0].content.parts[0].text);
