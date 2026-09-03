import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini AI client
// The GoogleGenAI sdk automatically picks up process.env.GEMINI_API_KEY
// but we pass it explicitly to handle build-time placeholders safely.
const apiKey = process.env.GEMINI_API_KEY || 'dummy_api_key';

export const ai = new GoogleGenAI({ apiKey });
