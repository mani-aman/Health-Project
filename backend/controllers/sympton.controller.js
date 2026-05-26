const OpenAI = require("openai");
const Symptom = require("../models/Symptom.model");

// ✅ OpenAI setup
let openai;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (e) {
  console.log("OpenAI symptom checker not configured, skipping...");
}

// 🎭 Mock symptom analysis for when OpenAI is unavailable
const getMockSymptomAnalysis = (symptoms) => {
  const lower = symptoms.toLowerCase();
  if (lower.includes("headache") && lower.includes("fever")) {
    return {
      condition: "Possible Viral Infection",
      severity: "Medium",
      advice:
        "Rest, stay hydrated, and monitor your temperature. See a doctor if symptoms worsen.",
      medicines: ["Acetaminophen", "Ibuprofen"],
    };
  }
  if (lower.includes("chest pain")) {
    return {
      condition: "Potential Cardiac or Respiratory Issue",
      severity: "High",
      advice:
        "Seek immediate medical attention. Chest pain should never be ignored.",
      medicines: [],
    };
  }
  if (lower.includes("cough") || lower.includes("cold")) {
    return {
      condition: "Common Cold / Upper Respiratory Infection",
      severity: "Low",
      advice:
        "Rest, drink warm fluids, and use a humidifier. Consult a doctor if symptoms persist beyond 10 days.",
      medicines: ["Cough syrup", "Vitamin C", "Zinc lozenges"],
    };
  }
  return {
    condition: "General Malaise",
    severity: "Low",
    advice:
      "Monitor your symptoms and maintain a healthy diet and sleep schedule. Consult a healthcare provider if symptoms persist.",
    medicines: [],
  };
};

// 🤖 Symptom Checker Controller
const symptomCheck = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const userId = req.user.id;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: "Symptoms are required",
      });
    }

    let parsed;

    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a medical AI assistant.

Analyze symptoms and return ONLY valid JSON:

{
  "condition": "",
  "severity": "Low | Medium | High",
  "advice": "",
  "medicines": []
}

Rules:
- Do NOT give dangerous prescriptions
- Always suggest doctor for serious symptoms
          `,
          },
          {
            role: "user",
            content: `Symptoms: ${symptoms}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      let result = completion.choices[0].message.content;
      result = result.replace(/```json|```/g, "");
      parsed = JSON.parse(result);
    } else {
      // Fallback mock response
      parsed = getMockSymptomAnalysis(symptoms);
    }

    // Save to DB
    const symptomRecord = new Symptom({
      userId,
      symptoms,
      condition: parsed.condition,
      severity: parsed.severity,
      advice: parsed.advice,
      medicines: parsed.medicines || [],
    });
    await symptomRecord.save();

    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Symptom AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI failed to analyze symptoms",
    });
  }
};

module.exports = { symptomCheck };
