import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use flash-preview for OCR as it is fast and efficient.
const OCR_MODEL = "gemini-3-flash-preview";
// Switched to flash-preview for Analysis as well to improve speed.
// We will use 'thinkingConfig' to maintain high accuracy.
const ANALYSIS_MODEL = "gemini-3-flash-preview";

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
  
  const formattedCandidates = candidateNames.map((name, i) => `"${name}"`).join(", ");

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
          text: `You are a typography expert performing a forensic font analysis.

          INPUTS:
          1. TARGET IMAGE: Contains text with unknown fonts.
          2. REFERENCE SHEET: Shows the text rendered in specific candidate fonts.
          3. VALID CANDIDATE LIST: [${formattedCandidates}]

          TASK:
          1. Analyze the TARGET IMAGE's visual features (serifs, terminals, x-height, contrast, etc.).
          2. Compare strictly against the fonts visible in the REFERENCE SHEET.
          3. Identify the BEST MATCH from the VALID CANDIDATE LIST.
          4. **Detailed Analysis**: Break down specific segments. If the image uses multiple fonts, identify which candidate matches which part.
          5. Suggest complementary fonts.

          CONSTRAINTS:
          - You MUST ONLY return font names that exactly match the strings in the VALID CANDIDATE LIST. Do not make up names.
          - If a text segment in the target image does not match ANY candidate, mark the fontName as "Unknown/None".
          - "textSegment" must be actual text visible in the Target Image.
          - If the fonts are visually identical, report a high confidence match.

          Return JSON matching the schema.`
        }
      ]
    },
    config: {
      // Enable thinking to improve accuracy while using the faster Flash model
      thinkingConfig: { thinkingBudget: 2048 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchFound: { type: Type.BOOLEAN },
          bestMatchFontName: { 
            type: Type.STRING, 
            description: "The name of the font from the VALID CANDIDATE LIST that best matches the primary text." 
          },
          confidence: { type: Type.NUMBER, description: "Overall confidence score between 0 and 100." },
          reasoning: { type: Type.STRING, description: "Overall explanation of why this font is the match." },
          detailedMatches: {
            type: Type.ARRAY,
            description: "Breakdown of specific text segments or characters and their corresponding font matches.",
            items: {
              type: Type.OBJECT,
              properties: {
                textSegment: { type: Type.STRING, description: "The specific part of the text (e.g., 'The header', 'The letter Q', 'Word: Hello')." },
                fontName: { type: Type.STRING, description: "The candidate font name from the provided list." },
                confidence: { type: Type.NUMBER },
                reasoning: { type: Type.STRING, description: "Specific visual evidence (e.g. 'Double-story g matches candidate 2', 'Slanted e')." }
              },
              required: ["textSegment", "fontName", "confidence", "reasoning"]
            }
          },
          similarities: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of visual features that match."
          },
          differences: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "If not a perfect match, what are the slight differences?"
          },
          recommendations: {
            type: Type.ARRAY,
            description: "Suggest 3 complementary fonts that pair well with the best match.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the suggested font (e.g. Roboto, Playfair Display)" },
                reason: { type: Type.STRING, description: "Why this pairing works (e.g. 'High contrast sans-serif to balance the serif')" },
                usage: { type: Type.STRING, description: "Recommended usage (e.g. 'Body Text', 'Navigation', 'Subheadings')" }
              },
              required: ["name", "reason", "usage"]
            }
          }
        },
        required: ["matchFound", "bestMatchFontName", "confidence", "reasoning", "similarities", "detailedMatches", "recommendations"]
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
