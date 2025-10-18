// ✅ Import fetch (CommonJS for Netlify)
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key is not configured on the server." }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { vibe, subVibe, dynamic, language, context: userContext, length, intensity } = body;

    if (!vibe || !subVibe || !dynamic || !language || !length || !intensity) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required input fields." }),
      };
    }

    const systemPrompt = `
You are WriteForBae, an AI specialized in crafting perfectly personalized, Gen Z-style messages.
Tone: relatable, emotionally intelligent, expert in modern slang.
Rules: Never use asterisks for emphasis. Use 1-3 emojis naturally. Avoid hashtags or formal sign-offs.
`;

    let userQuery = `Generate a paragraph with the following:
- Main Vibe: ${vibe}
- Specific Vibe: ${subVibe}
- Writing Dynamic: ${dynamic}
- Language Style: ${language}
- Desired Length: ${length}
- Tone Intensity: ${intensity}`;

    if (userContext) userQuery += `\n- Context to consider: "${userContext}"`;

    // ✅ Correct Gemini 2.5 Pro payload: system + user messages separated
    const payload = {
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userQuery }] }
      ]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GOOGLE_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Google AI API Error:", result);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: JSON.stringify(result) }),
      };
    }

    // ✅ Safely extract the generated text
    const generatedText =
      result?.candidates?.[0]?.content?.[0]?.text ||
      result?.candidates?.[0]?.output?.[0]?.content?.[0]?.text ||
      "No response generated.";

    return {
      statusCode: 200,
      body: JSON.stringify({ text: generatedText }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
    };
  }
};
