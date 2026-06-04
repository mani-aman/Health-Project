const OpenAI = require("openai");
const Workout = require("../models/workout.model");

let openai;
const openaiClient = (() => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const baseURL =
      process.env.OPENROUTER_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://openrouter.ai/api/v1";

    // If OpenRouter key is present, use OpenRouter-compatible endpoint.
    if (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_BASE_URL) {
      return new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
        baseURL,
      });
    }

    // Fallback to OpenAI (default baseURL)
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.log("OpenAI/OpenRouter workout client init failed, using mock...");
    return null;
  }
})();

openai = openaiClient;

const getOpenAICompatibleClient = () => {
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
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
};

// 🎭 Mock workout generator for when OpenAI is unavailable
const getMockWorkout = (weight, height, bmi, goal) => {
  const lowerGoal = goal.toLowerCase();
  if (lowerGoal.includes("lose") || lowerGoal.includes("weight loss")) {
    return {
      plan: [
        "30 minutes of brisk walking or jogging daily",
        "High-intensity interval training (HIIT) 3x per week",
        "Circuit training with bodyweight exercises",
        "Reduce refined carbs and increase protein intake",
        "Track calories and aim for a 300-500 kcal deficit",
      ],
    };
  }
  if (lowerGoal.includes("muscle") || lowerGoal.includes("gain")) {
    return {
      plan: [
        "Progressive overload strength training 4x per week",
        "Focus on compound lifts: squats, deadlifts, bench press",
        "Eat in a slight caloric surplus (200-300 kcal)",
        "Consume 1.6-2.2g protein per kg of bodyweight",
        "Sleep 7-9 hours for optimal recovery",
      ],
    };
  }
  return {
    plan: [
      "Mix of cardio and strength training 4x per week",
      "30-minute moderate cardio sessions",
      "Full-body resistance training twice weekly",
      "Yoga or stretching for flexibility and recovery",
      "Stay hydrated and maintain balanced nutrition",
    ],
  };
};

// 💪 Generate workout using AI
const generateWorkout = async (req, res) => {
  try {
    const { weight, height, goal } = req.body;

    if (!weight || !height || !goal) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    // BMI calculation
    const bmi = parseFloat(
      (weight / ((height / 100) * (height / 100))).toFixed(2),
    );

    let parsed;

    if (openai) {
      // 🤖 AI prompt
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a fitness expert. Give workout plan in JSON format only.",
          },
          {
            role: "user",
            content: `
User Data:
Weight: ${weight}kg
Height: ${height}cm
BMI: ${bmi}
Goal: ${goal}

Return ONLY JSON:
{
  "plan": ["...", "...", "..."]
}
          `,
          },
        ],
        temperature: 0.7,
      });

      let result = completion.choices?.[0]?.message?.content;
      if (typeof result !== "string")
        throw new Error("AI returned empty content");

      // clean fences and attempt robust extraction
      result = result.replace(/```json|```/g, "");

      const firstObj = result.indexOf("{");
      const firstArr = result.indexOf("[");

      let start = -1;
      if (firstObj !== -1 && firstArr !== -1)
        start = Math.min(firstObj, firstArr);
      else start = firstObj !== -1 ? firstObj : firstArr;

      if (start !== -1) {
        const candidate = result.slice(start);
        parsed = JSON.parse(candidate);
      } else {
        parsed = JSON.parse(result);
      }
    } else {
      // Fallback mock response
      parsed = getMockWorkout(weight, height, bmi, goal);
    }

    // Save to DB
    const workoutRecord = new Workout({
      weight,
      height,
      goal,
      bmi,
      plan: parsed.plan,
    });
    await workoutRecord.save();

    res.json({
      success: true,
      bmi,
      plan: parsed.plan,
    });
  } catch (error) {
    console.error("Workout AI Error:", error);

    // If AI fails to parse/return JSON, fall back to mock plan to keep UX working.
    try {
      const fallback = getMockWorkout(weight, height, bmi, goal);
      return res.json({
        success: true,
        bmi,
        plan: fallback.plan,
        fallback: true,
      });
    } catch (fallbackErr) {
      return res.status(500).json({
        success: false,
        message: "Workout generation failed",
      });
    }
  }
};

module.exports = { generateWorkout };
