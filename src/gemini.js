// gemini.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:import.meta.env.VITE_GEMINI_API_KEY, // api key
});

export async function generateReviewSummary(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // In @google/genai, text is a getter: response.text
    return response.text;
  } catch (err) {
    console.error("Gemini error:", err);
    throw err;
  }
}
