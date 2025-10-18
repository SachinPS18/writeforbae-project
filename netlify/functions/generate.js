// This is the secure backend function (the "waiter").
// It runs on Netlify's servers, not in the user's browser.

exports.handler = async function(event, context) {
    // 1. Get the Google AI API key from the secure environment variables
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

    // Check if the API key is available
    if (!GOOGLE_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API key is not configured on the server." }),
        };
    }

    // 2. Get the user's request data from the frontend
    const body = JSON.parse(event.body);
    const { vibe, subVibe, dynamic, language, context: userContext, length, intensity } = body;

    // 3. Construct the prompts for the Gemini API
    const systemPrompt = "You are WriteForBae, an AI specialized in crafting perfectly personalized, Gen Z-style messages. Your tone is relatable, emotionally intelligent, and you're an expert in modern slang and internet culture. It is a strict rule that you must NEVER use asterisks for emphasis (like *this*). Instead, use stronger words or emojis to convey feeling. Keep the language natural and conversational, like a real person would text. Avoid hashtags or formal sign-offs. Always include 1-3 relevant emojis.";

    let userQuery = `Generate a paragraph with the following specifications:
        - Main Vibe: ${vibe}
        - Specific Vibe: ${subVibe}
        - Writing Dynamic: ${dynamic}
        - Language Style: ${language}
        - Desired Length: ${length}
        - Tone Intensity: ${intensity}`;

    if (userContext) {
        userQuery += `\n- Context to consider: "${userContext}"`;
    }
    
    // 4. Call the Google AI API securely from the server
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GOOGLE_API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Google AI API Error:", errorBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: "Failed to get a response from the AI service." }),
            };
        }

        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // 5. Send the result back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ text: generatedText }),
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "An internal server error occurred." }),
        };
    }
};