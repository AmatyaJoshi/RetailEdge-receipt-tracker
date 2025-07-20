import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGeminiApi() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        console.error("GEMINI_API_KEY is not set in environment variables");
        process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Say hello from Gemini!" }
                    ]
                }
            ]
        });
        const geminiResponse = await result.response;
        const text = await geminiResponse.text();
        console.log("Gemini API test successful! Response:", text);
    } catch (error) {
        console.error("Gemini API test failed:", error);
        process.exit(1);
    }
}

// ESM: top-level await is allowed
await testGeminiApi(); 