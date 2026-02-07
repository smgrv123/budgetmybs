import { GoogleGenerativeAI } from '@google/generative-ai';

import { GEMINI_MODEL, getGeminiApiKey } from '@/src/config/env';

/**
 * Initialize Gemini AI client
 * @returns GoogleGenerativeAI instance or null if no API key
 */
export const initializeGemini = async (): Promise<GoogleGenerativeAI | null> => {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    console.warn('No Gemini API key found');
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate content using Gemini AI
 * @param prompt - The prompt to send to Gemini
 * @returns Generated content as string
 */
export const generateContent = async (prompt: string): Promise<string> => {
  const genAI = await initializeGemini();
  if (!genAI) {
    throw new Error('Gemini API not initialized - no API key available');
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
};

/**
 * Generate structured JSON response from Gemini
 *
 * IMPORTANT: Why markdown extraction is needed
 * --------------------------------------------
 * While Gemini supports JSON mode, in practice the API sometimes:
 * 1. Wraps JSON in markdown code blocks: ```json\n{...}\n```
 * 2. Includes explanatory text before/after the JSON despite prompt instructions
 * 3. Changes behavior between model versions or during prompt iterations
 *
 * This function provides DEFENSIVE PROGRAMMING:
 * - First attempts to extract JSON from markdown blocks (common case)
 * - Falls back to parsing the entire response (ideal case)
 * - Provides full response text in error messages for debugging
 *
 * ALTERNATIVES CONSIDERED:
 * - Using response_mime_type: "application/json" parameter (requires specific model versions)
 * - Stricter prompts (unreliable - AI doesn't always follow instructions)
 * - Error and retry (wasteful - costs API calls and user time)
 *
 * This regex approach is a minimal safety net that prevents frustrating failures
 * with negligible performance cost. Keep it unless Gemini guarantees 100% raw JSON.
 *
 * @param prompt - The prompt to send to Gemini
 * @returns Parsed JSON object of type T
 * @throws Error if JSON parsing fails (includes full response for debugging)
 */
export const generateJSON = async <T>(prompt: string): Promise<T> => {
  const text = await generateContent(prompt);

  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonString = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonString.trim()) as T;
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON:', error);
    console.error('Response text:', text);
    throw new Error('Invalid JSON response from Gemini AI');
  }
};
