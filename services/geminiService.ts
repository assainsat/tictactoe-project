
import { GoogleGenAI, Type } from "@google/genai";
import { CellValue, Player } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface AiMoveResponse {
  index: number;
  commentary: string;
}

export const getAiMove = async (
  board: CellValue[],
  aiPlayer: Player,
  humanPlayer: Player
): Promise<AiMoveResponse> => {
  // Construct board representation for the prompt
  const boardStr = board.map((cell, i) => cell === null ? i : cell).join('|');

  const prompt = `
    You are a Grandmaster Tic-Tac-Toe Artificial Intelligence named "AI Prime".
    The current board state is represented by indices 0-8: ${boardStr}.
    You are playing as '${aiPlayer}'. The human is '${humanPlayer}'.
    
    Tasks:
    1. Select the best next move index (0-8) that is currently null.
    2. Provide a short, witty, or slightly arrogant commentary about your move or the human's performance. Keep it under 20 words.
    
    Rules: 
    - Always win if possible.
    - Always block the human if they are about to win.
    - If neither, take center or corners.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            index: { type: Type.INTEGER, description: "The chosen cell index (0-8)" },
            commentary: { type: Type.STRING, description: "Witty commentary about the move" },
          },
          required: ["index", "commentary"],
        },
      },
    });

    const result = JSON.parse(response.text.trim());
    return result as AiMoveResponse;
  } catch (error) {
    console.error("AI API Error:", error);
    // Fallback logic if API fails
    const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
    return {
      index: available[Math.floor(Math.random() * available.length)],
      commentary: "My circuits flickered, but I still see your defeat."
    };
  }
};
