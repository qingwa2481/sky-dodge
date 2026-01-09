
import { GoogleGenAI } from "@google/genai";

export async function getPerformanceAnalysis(score: number): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User survived for ${score.toFixed(2)} seconds in a bullet-dodging game. 
      The goal is to reach 20 seconds or more. 
      Give a short, witty, and encouraging 2-sentence analysis of their performance. 
      If they got less than 10s, be a bit teasing. 
      If they got 10-20s, call them a skilled rookie. 
      If they got 20s+, call them a legend.
      Response should be in Chinese.`
    });
    return response.text || "太棒了，继续加油！";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return score > 20 ? "你是真正的男人！" : "再接再厉，还差一点点。";
  }
}
