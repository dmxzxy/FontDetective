import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use flash-preview for OCR as it is fast and efficient.
const OCR_MODEL = "gemini-3-flash-preview";
// We use pro-preview for the complex visual comparison task.
const ANALYSIS_MODEL = "gemini-3-pro-preview";

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const response = await ai.models.generateContent({
      model: OCR_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Extract the most prominent text from this image. Return ONLY the raw text found, no markdown, no explanations. If there are multiple lines, keep them on one line separated by spaces. Limit to 50 characters."
          }
        ]
      }
    });

    return response.text?.trim() || "Sample Text";
  } catch (error) {
    console.error("Text extraction failed", error);
    return "Sample Text";
  }
};

export const analyzeFonts = async (
  targetImageBase64: string,
  referenceSheetBase64: string,
  candidateNames: string[]
): Promise<AnalysisResult> => {
  const cleanTarget = targetImageBase64.replace(/^data:image\/\w+;base64,/, "");
  const cleanReference = referenceSheetBase64.replace(/^data:image\/\w+;base64,/, "");

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanTarget,
          },
        },
        {
          inlineData: {
            mimeType: "image/png",
            data: cleanReference,
          },
        },
        {
          text: `You are a typography expert. 
          
          Image 1 is the TARGET image containing unknown fonts.
          Image 2 is a REFERENCE SHEET containing the text "${candidateNames.length > 0 ? 'rendered in candidate fonts' : ''}".
          
          The Reference Sheet lists candidate fonts. Each candidate has a label (e.g., "1. FontName") followed by the sample text rendered in that font.

          Task:
          1. Analyze the distinct visual features of the font in the TARGET image (serifs, stroke contrast, letter terminals, x-height, aperture).
          2. Compare these features against each candidate in the REFERENCE SHEET.
          3. Identify which candidate is the closest match.
          
          Return JSON matching the schema.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchFound: { type: Type.BOOLEAN },
          bestMatchFontName: { type: Type.STRING, description: "The name of the font from the candidate list that matches best." },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100." },
          reasoning: { type: Type.STRING, description: "Detailed explanation of why this font is the match." },
          similarities: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of visual features that match."
          },
          differences: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "If not a perfect match, what are the slight differences?"
          }
        },
        required: ["matchFound", "bestMatchFontName", "confidence", "reasoning", "similarities"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  try {
    return JSON.parse(response.text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON", response.text);
    throw new Error("Invalid response format from AI");
  }
};
