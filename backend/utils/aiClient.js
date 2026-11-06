/**
 * Shared OpenAI / OpenRouter client factory.
 * Import this instead of duplicating client init in every controller.
 */
const OpenAI = require("openai");

let _client = null;

const getAIClient = () => {
  if (_client) return _client;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openrouterKey && !openaiKey) return null;

  try {
    if (openrouterKey) {
      _client = new OpenAI({
        apiKey: openrouterKey,
        baseURL:
          process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      });
    } else {
      _client = new OpenAI({ apiKey: openaiKey });
    }
  } catch (e) {
    console.warn("AI client init failed:", e.message);
    return null;
  }

  return _client;
};

module.exports = getAIClient;
