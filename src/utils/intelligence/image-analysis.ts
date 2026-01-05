import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiClient } from "@/lib/gemini-helper";

export interface ImageAnalysisResult {
  productName: string;
  description: string;
  category: string;
  attributes: Record<string, string>;
  keywords: string[];
}

// Helper to get working model dynamically
async function getWorkingModel(genAI: GoogleGenerativeAI): Promise<string> {
  const modelsToTry = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      await testModel.generateContent("test");
      return modelName;
    } catch {
      continue;
    }
  }
  
  return modelsToTry[0];
}

export async function analyzeProductImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  const genAI = createGeminiClient();
  if (!genAI) {
    throw new Error("Gemini API key not configured");
  }

  const modelName = await getWorkingModel(genAI);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
Analyze this product image and infer the following information directly from the image (do NOT rely on user input):
1. Product name (be specific and descriptive)
2. Detailed description
3. Product category
4. Key attributes (material, color, size, weight, dimensions, etc. — estimate if not explicit)
5. Estimated weight (in grams or kg, inferred visually)
6. Estimated dimensions (L x W x H in cm, inferred visually)
7. Estimated retail price (in USD, if possible, inferred visually)
8. Relevant keywords for supplier matching

Return the information in a structured JSON format that can be used for supplier matching and cost calculation. If you are unsure, provide your best estimate based on the image only.
`;

  try {
    // For image URLs, you'll need to fetch and convert to base64 or use file path
    // This is a simplified version - adjust based on your image source
    const result = await model.generateContent([prompt, imageUrl]);
    const response = await result.response;
    const text = response.text();

    // Parse the response (you may want to use structured output or JSON mode)
    // For now, this is a placeholder - implement proper parsing
    return parseAnalysisResponse(text);
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze product image");
  }
}

function parseAnalysisResponse(text: string): ImageAnalysisResult {
  // Implement parsing logic based on Gemini's response format
  // This is a placeholder - adjust based on actual response structure
  return {
    productName: "Unknown Product",
    description: text,
    category: "Uncategorized",
    attributes: {},
    keywords: [],
  };
}

