import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

async function testGeminiApi() {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        console.error("GEMINI_API_KEY is not set in environment variables");
        process.exit(1);
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    // Define the full receipt schema for testing
    const receiptSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
            invoice_id: { type: SchemaType.STRING },
            date_issued: { type: SchemaType.STRING },
            issued_to: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    address: { type: SchemaType.STRING }
                },
                required: ["name", "address"]
            },
            line_items: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        no: { type: SchemaType.INTEGER },
                        description: { type: SchemaType.STRING },
                        qty: { type: SchemaType.INTEGER },
                        price: { type: SchemaType.NUMBER },
                        subtotal: { type: SchemaType.NUMBER }
                    },
                    required: ["no", "description", "qty", "price", "subtotal"]
                }
            },
            grand_total: { type: SchemaType.NUMBER },
            currency: { type: SchemaType.STRING },
            note: {
                type: SchemaType.OBJECT,
                properties: {
                    bank_name: { type: SchemaType.STRING },
                    account_no: { type: SchemaType.STRING }
                },
                required: ["bank_name", "account_no"]
            },
            issuer: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    title: { type: SchemaType.STRING }
                },
                required: ["name", "title"]
            }
        },
        required: ["invoice_id", "date_issued", "issued_to", "line_items", "grand_total", "currency", "note", "issuer"]
    };
    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `Respond with a JSON object for a sample invoice/receipt. Use the following fields: invoice_id (string), date_issued (string), issued_to (object: name, address), line_items (array of objects: no, description, qty, price, subtotal), grand_total (number), currency (string), note (object: bank_name, account_no), issuer (object: name, title).` }
                    ]
                }
            ]
        });
        const geminiResponse = await result.response;
        const text = await geminiResponse.text();
        console.log("Gemini API test with full receipt schema successful! Response:\n", text);
    } catch (error) {
        console.error("Gemini API test with full receipt schema failed:", error);
        process.exit(1);
    }
}

// ESM: top-level await is allowed
await testGeminiApi(); 