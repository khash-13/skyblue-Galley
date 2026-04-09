import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const extractMenuFromImage = async (base64Image: string, mimeType: string) => {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      vendorName: { type: Type.STRING, description: "Name of the vendor/hotel/caterer if visible. Null if not found." },
      currency: { type: Type.STRING, description: "Currency used in the menu (e.g., USD, EUR). Null if not found." },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sectionName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                  confidence: { type: Type.NUMBER }
                },
                required: ["name"]
              }
            }
          },
          required: ["sectionName", "items"]
        }
      },
      notes: { type: Type.ARRAY, items: { type: Type.STRING } },
      uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["sections"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      },
      "Extract the menu items, prices, and categories from this image. Return ONLY valid JSON matching the requested schema. Do not include markdown formatting or prose. Deduplicate near-identical items. If currency is missing, leave it null."
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.1
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to extract menu");
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Failed to parse extracted menu data");
  }
};
