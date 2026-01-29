
import { GoogleGenAI } from "@google/genai";

// Always use the required structure for initialization and strictly use process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateItinerary = async (preferences: string): Promise<string> => {
  // Use ai.models.generateContent directly with model name and prompt as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a personalized 5-day Kenyan travel itinerary for Zipton Tours. 
    User preferences: ${preferences}. 
    Focus on "Where Adventure Meets Culture". 
    Include specific locations like Maasai Mara, Amboseli, or Lamu depending on preferences.
    Format the response as a professional, inspiring travel guide.`,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    },
  });

  // Access the .text property directly (not as a function) to retrieve the response content
  return response.text || "Sorry, we couldn't generate an itinerary right now. Please contact our team directly!";
};