const OpenAI = require("openai");

const getOpenAICompatibleClient = () => {
  // Prefer OpenRouter (OpenAI-compatible)
  if (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_BASE_URL) {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL =
      process.env.OPENROUTER_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://openrouter.ai/api/v1";

    if (apiKey) {
      return new OpenAI({ apiKey, baseURL });
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return null;
};
const Chat = require("../models/chat.model");

// ✅ OpenAI/OpenRouter setup
const openai = (() => {
  try {
    const client = getOpenAICompatibleClient();
    if (!client) console.log("OpenAI/OpenRouter not configured, using mock...");
    return client;
  } catch (e) {
    console.log("OpenAI/OpenRouter client init failed, using mock...");
    return null;
  }
})();

// 🎭 Mock reply generator for when OpenAI is unavailable
const getMockReply = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes("headache") || lower.includes("migraine")) {
    return "Headaches can be caused by stress, dehydration, or eye strain. Drink water, rest in a dark room, and consider seeing a doctor if it persists.";
  }
  if (lower.includes("fever")) {
    return "A fever is often a sign your body is fighting an infection. Stay hydrated, rest, and monitor your temperature. Seek medical attention if it exceeds 103°F (39.4°C).";
  }
  if (lower.includes("workout") || lower.includes("exercise")) {
    return "For a balanced routine, aim for 150 minutes of moderate aerobic activity per week plus strength training twice a week. Always warm up before exercising!";
  }
  if (lower.includes("diet") || lower.includes("eat")) {
    return "A balanced diet includes plenty of vegetables, lean proteins, whole grains, and healthy fats. Limit processed foods and added sugars.";
  }
  return "I'm here to help with general health and fitness advice. Could you provide a bit more detail so I can assist you better?";
};

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    let reply;

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional fitness and health assistant. Give safe, short, and useful advice.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 150,
      });
      reply = completion.choices[0].message.content;
    } else {
      // Fallback mock response
      reply = getMockReply(message);
    }

    // Save to DB
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "ai", content: reply });
    await chat.save();

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI service failed",
    });
  }
};

module.exports = { chatWithAI };
