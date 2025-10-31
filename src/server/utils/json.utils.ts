/**
 * JSON Utility Functions
 *
 * Helper functions for processing and cleaning JSON data.
 */

/**
 * Clean JSON text by removing markdown fences and invalid control characters
 *
 * This is useful when parsing JSON from LLM responses that may include
 * markdown code fences or control characters.
 *
 * @param text - The raw text containing JSON
 * @returns Cleaned JSON text ready for parsing
 */
export function cleanJSONText(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/m, "");
  cleaned = cleaned.replace(/^```\s*/m, "");
  cleaned = cleaned.replace(/```\s*$/m, "");
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim();
}
