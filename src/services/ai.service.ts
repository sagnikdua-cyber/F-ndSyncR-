import { ai } from '@/lib/gemini/config';
import { Type, Schema } from '@google/genai';

export class AIService {
  /**
   * Analyze an image to extract structured public and private characteristics.
   * Note: The File object must be converted to base64 or sent as bytes to Gemini.
   */
  static async analyzeFoundItem(imageBase64: string, mimeType: string) {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_api_key' || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error("GEMINI_API_KEY is not configured on the server. AI Analysis cannot proceed.");
      }

      const prompt = `
        Analyze this image of a found item.
        Extract public characteristics (color, shape, brand, type, visible text/stickers).
        Extract private characteristics (distinctive scratches, hidden marks, exact contents, damage).
        Public characteristics should be visible to anyone at a glance.
        Private characteristics are unique owner-specific details that serve as evidence of ownership.
        IMPORTANT: Do not invent characteristics that cannot be reasonably observed. If a characteristic is uncertain, leave it blank or represent it as 'unknown'.
      `;

      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          objectType: { type: Type.STRING, description: "The general type of the object (e.g. 'water bottle', 'wallet')" },
          publicCharacteristics: {
            type: Type.OBJECT,
            description: "Features visible to anyone",
            properties: {
              color: { type: Type.STRING },
              shape: { type: Type.STRING },
              brand: { type: Type.STRING },
              visibleText: { type: Type.STRING },
            }
          },
          privateCharacteristics: {
            type: Type.OBJECT,
            description: "Hidden or unique features that prove ownership (scratches, internal contents, etc)",
            properties: {
              distinctiveMarks: { type: Type.STRING },
              damage: { type: Type.STRING },
              contents: { type: Type.STRING },
            }
          }
        },
        required: ["objectType", "publicCharacteristics", "privateCharacteristics"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: imageBase64, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      const parsed = JSON.parse(response.text);
      if (!parsed.objectType || typeof parsed.publicCharacteristics !== 'object' || typeof parsed.privateCharacteristics !== 'object') {
        throw new Error("AI output missing required structural fields");
      }
      
      return parsed;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze item image');
    }
  }
}
