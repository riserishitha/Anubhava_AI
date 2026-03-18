import geminiConfig from "../../config/gemini.js";
import { AIServiceError } from "../../utils/errors.js";
import { RETRY_CONFIG } from "../../constants/index.js";
import logger from "../../utils/logger.js";

/**
 * Gemini AI Service
 * Wrapper for Google Gemini API with retry logic and error handling
 */
class GeminiService {
  constructor() {
    this.model = null;
  }

  /**
   * Initialize Gemini model
   */
  async initialize() {
    if (!this.model) {
      this.model = geminiConfig.initialize();
    }
    return this.model;
  }

  /**
   * Generate content with retry logic
   */
  async generateContent(prompt, options = {}) {
    const startTime = Date.now();

    try {
      await this.initialize();

      const result = await this.retryWithBackoff(
        () => geminiConfig.generateContent(prompt, options),
        RETRY_CONFIG.MAX_RETRIES,
      );

      const responseTime = Date.now() - startTime;
      logger.ai("GEMINI_GENERATE", prompt, responseTime);

      return result;
    } catch (error) {
      logger.error("Gemini generation failed:", error);
      throw new AIServiceError(
        `Failed to generate content: ${error.message}`,
        "Gemini",
      );
    }
  }

  /**
   * Generate JSON response
   * Parses AI response as JSON
   */
  async generateJSON(prompt, options = {}) {
    try {
      const jsonPrompt = this.formatJSONPrompt(prompt);

      // Roadmap/assessment JSON can be large; default higher output limit unless explicitly provided.
      const baseOptions = {
        ...options,
        maxOutputTokens: options.maxOutputTokens ?? 16384,
      };

      let response;
      try {
        response = await this.generateContent(jsonPrompt, {
          ...baseOptions,
          // Hint the SDK/model to return JSON if supported
          responseMimeType: "application/json",
        });
      } catch (error) {
        // If the SDK/model doesn't support responseMimeType, fall back to normal generation.
        logger.warn(
          "Gemini JSON mimeType hint failed; retrying without responseMimeType",
          {
            error: error.message,
          },
        );

        response = await this.generateContent(jsonPrompt, baseOptions);
      }

      logger.debug("Raw response from Gemini:", {
        type: typeof response,
        length: String(response).length,
        preview: String(response).slice(0, 300),
      });

      try {
        return this.parseJSONResponse(response);
      } catch (parseError) {
        // Common root cause: model output got truncated (token limit) or added non-JSON prose.
        // Attempt one repair pass using the raw output.
        logger.warn("Initial JSON parse failed; attempting repair pass", {
          error: parseError.message,
          responseType: typeof response,
        });

        const raw =
          typeof response === "string"
            ? response.slice(0, 12000)
            : String(response);

        const repairPrompt = `You MUST output ONLY valid, complete JSON (no markdown code blocks, no \`\`\`, no explanations).

The following text was intended to be JSON but is invalid or incomplete. Fix it so it becomes valid JSON and matches the original requested structure. Ensure all arrays and objects are properly closed.

ORIGINAL INSTRUCTION:
${prompt}

INVALID OUTPUT:
${raw}
`;

        const repaired = await this.generateContent(repairPrompt, {
          ...baseOptions,
          temperature: 0.1,
        });

        logger.debug("Repaired response from Gemini:", {
          type: typeof repaired,
          length: String(repaired).length,
          preview: String(repaired).slice(0, 300),
        });

        return this.parseJSONResponse(repaired);
      }
    } catch (error) {
      logger.error("Gemini JSON generation failed:", error);
      throw error;
    }
  }

  /**
   * Format prompt to request JSON output
   */
  formatJSONPrompt(prompt) {
    return `${prompt}\n\nYou MUST respond with ONLY a valid JSON object or array (RFC 8259 compliant). Do NOT include:
- Markdown code blocks or backticks
- Explanatory text before or after the JSON
- Comments or trailing commas

The JSON must:
- Start immediately with { or [
- End with } or ]
- Use only double quotes for strings
- Contain no undefined, NaN, or Infinity values`;
  }

  /**
   * Parse JSON response from AI
   */
  parseJSONResponse(response) {
    const preview =
      typeof response === "string"
        ? response.slice(0, 1200)
        : String(response).slice(0, 1200);

    try {
      const jsonString = this.extractJsonString(response);

      try {
        const parsed = JSON.parse(jsonString);
        logger.debug("Successfully parsed JSON response");
        return parsed;
      } catch (parseErr) {
        logger.warn("Initial JSON parse failed, attempting sanitization", {
          error: parseErr.message,
          jsonLength: jsonString.length,
        });

        // Common model mistakes: trailing commas, NaN/Infinity.
        const sanitized = jsonString
          .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
          .replace(/,\s*\n\s*([}\]])/g, "$1") // Remove trailing commas before newlines
          .replace(/\b-?Infinity\b/g, "null") // Replace Infinity with null
          .replace(/\bNaN\b/g, "null") // Replace NaN with null
          .replace(/:\s*undefined\b/g, ": null") // Replace undefined with null
          .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double quotes in values

        try {
          const parsed = JSON.parse(sanitized);
          logger.info("Successfully parsed JSON after sanitization");
          return parsed;
        } catch (sanitizeErr) {
          // If sanitization also fails, log detailed error info
          logger.error("Sanitized JSON still invalid:", {
            originalError: parseErr.message,
            sanitizeError: sanitizeErr.message,
            jsonLength: jsonString.length,
            jsonPreview: jsonString.slice(0, 500),
            sanitizedPreview: sanitized.slice(0, 500),
          });
          throw sanitizeErr;
        }
      }
    } catch (error) {
      logger.error("Failed to parse JSON response:", {
        preview,
        errorMessage: error.message,
        errorType: error.name,
      });
      throw new AIServiceError("AI returned invalid JSON format");
    }
  }

  /**
   * Extract a JSON object/array from a model response.
   * Models sometimes wrap JSON in code fences or add a short preamble.
   */
  extractJsonString(text) {
    // Ensure we're working with a string
    if (typeof text !== "string") {
      text = String(text);
    }

    let cleaned = text.trim().replace(/^\uFEFF/, "");

    logger.debug("Starting JSON extraction", {
      originalLength: text.length,
      cleanedLength: cleaned.length,
      startsWithCodeFence: cleaned.startsWith("```"),
      firstChars: cleaned.slice(0, 100),
    });

    // Remove markdown code fences if present
    // Pattern 1: Standard triple backticks with optional json label
    let extracted = cleaned
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "");

    // Pattern 2: If Pattern 1 didn't work, try matching the full fence pattern
    if (extracted === cleaned) {
      const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch?.[1]) {
        extracted = fenceMatch[1];
        logger.debug("Extracted JSON from code fence");
      }
    }

    // Pattern 3: Remove backticks with json label
    if (extracted === cleaned) {
      const jsonMatch = cleaned.match(/`{1,3}json\s*([\s\S]*?)\s*`{1,3}/i);
      if (jsonMatch?.[1]) {
        extracted = jsonMatch[1];
        logger.debug("Extracted JSON from backtick fence with label");
      }
    }

    // Trim the extracted content
    extracted = extracted.trim();

    logger.debug("After fence removal", {
      extractedLength: extracted.length,
      firstChars: extracted.slice(0, 100),
    });

    // Find the first occurrence of { or [
    const openBraceIndex = extracted.indexOf("{");
    const openBracketIndex = extracted.indexOf("[");

    let startIndex = -1;
    if (openBraceIndex !== -1 && openBracketIndex !== -1) {
      startIndex = Math.min(openBraceIndex, openBracketIndex);
    } else if (openBraceIndex !== -1) {
      startIndex = openBraceIndex;
    } else if (openBracketIndex !== -1) {
      startIndex = openBracketIndex;
    }

    if (startIndex === -1) {
      logger.error("No JSON structure found", {
        extractedLength: extracted.length,
        extractedPreview: extracted.slice(0, 300),
      });
      throw new AIServiceError(
        "AI response did not contain valid JSON structure",
      );
    }

    // Now extract from the first bracket/brace to the last matching bracket/brace
    const jsonContent = extracted.slice(startIndex);

    // Use brace/bracket balancing to find the end
    const stack = [];
    let inString = false;
    let escape = false;
    let endIndex = -1;

    for (let i = 0; i < jsonContent.length; i++) {
      const ch = jsonContent[i];

      // Handle string escaping
      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === "\\") {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = false;
        }
        continue;
      }

      // Handle string start
      if (ch === '"') {
        inString = true;
        continue;
      }

      // Track opening brackets
      if (ch === "{" || ch === "[") {
        stack.push(ch);
        continue;
      }

      // Track closing brackets
      if (ch === "}" || ch === "]") {
        if (stack.length === 0) {
          logger.warn("Unmatched closing bracket encountered");
          break;
        }

        const last = stack[stack.length - 1];
        if ((last === "{" && ch === "}") || (last === "[" && ch === "]")) {
          stack.pop();
          if (stack.length === 0) {
            endIndex = i + 1;
            break;
          }
        } else {
          logger.warn("Mismatched brackets", { last, current: ch });
          break;
        }
      }
    }

    if (endIndex === -1) {
      logger.error("Could not find matching closing bracket", {
        stackLength: stack.length,
        remainingStack: stack,
        jsonLength: jsonContent.length,
        jsonPreview: jsonContent.slice(0, 500),
      });
      throw new AIServiceError("AI response JSON is incomplete or malformed");
    }

    const result = jsonContent.slice(0, endIndex).trim();
    logger.debug("Successfully extracted JSON", {
      jsonLength: result.length,
      startsCorrectly: result[0] === "{" || result[0] === "[",
      endsCorrectly:
        result[result.length - 1] === "}" || result[result.length - 1] === "]",
    });

    return result;
  }

  /**
   * Retry with exponential backoff
   */
  async retryWithBackoff(operation, maxRetries) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          const delay = Math.min(
            RETRY_CONFIG.INITIAL_DELAY_MS *
              Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
            RETRY_CONFIG.MAX_DELAY_MS,
          );

          logger.warn(`Retry attempt ${attempt + 1} after ${delay}ms`, {
            error: error.message,
          });

          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate embeddings (placeholder - Gemini doesn't have embedding API yet)
   * In production, use a dedicated embedding service
   */
  async generateEmbedding(text) {
    try {
      await this.initialize();
      // Use the new stable embedding model
      const embeddingModel = this.genAI.getGenerativeModel({
        model: "text-embedding-005",
      });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error("Embedding generation failed:", error);
      throw new AIServiceError("Failed to generate embedding", "Gemini");
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.initialize();
      const response = await this.generateContent("Hello", {
        maxOutputTokens: 10,
      });
      return { status: "healthy", response: !!response };
    } catch (error) {
      return { status: "unhealthy", error: error.message };
    }
  }
}

export default new GeminiService();
