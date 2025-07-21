import { createAgent, createTool } from "@inngest/agent-kit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import axios from "axios";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in your environment. You must use a valid Gemini API key from Google.");
}
console.log("[Gemini] Using official Gemini SDK with provided API key.");
const genAI = new GoogleGenerativeAI(geminiApiKey);

const parsePdfTool = createTool({
    name: "parse-pdf",
    description: "Analyzes the given PDF using Gemini's vision model directly via the Gemini API.",
    parameters: z.object({
        pdfUrl: z.string(),
    }),
    handler: async ({ pdfUrl }, { step }) => {
        try {
            console.log("[Gemini] PDF URL:", pdfUrl);
            // Download the PDF
            const pdfResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" });
            const pdfData = Buffer.from(pdfResponse.data, "binary");
            console.log("[Gemini] Downloaded PDF size:", pdfData.length, "bytes");
            if (pdfData.length === 0) {
                throw new Error("Downloaded PDF is empty. Check the file URL and storage.");
            }
            const pdfBase64 = pdfData.toString("base64");
            console.log("[Gemini] PDF base64 (first 100 chars):", pdfBase64.slice(0, 100));

            // Simplified, robust prompt
            const promptText = `Extract all text and tables from this invoice or receipt PDF. Output a single valid JSON object with all fields and line items you can find. Only output JSON.`;

            // Use Gemini's vision API to analyze the PDF and prompt
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
                        ]
                    }
                ]
            });
            const geminiResponse = await result.response;
            const text = await geminiResponse.text();
            console.log("[Gemini] Raw output:", text);
            // Try to parse as JSON
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                // Try to extract the first valid JSON object from the text
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        parsed = JSON.parse(match[0]);
                        console.warn("[Gemini] Output was not pure JSON, but extracted a valid object.");
                    } catch (e2) {
                        console.error("[Gemini] Did not return valid JSON (even after extraction):", text);
                        // Fallback: Try to extract just the raw text
                        const fallbackPrompt = `Extract all text from this PDF and return as JSON: { \"text\": \"...\" }`;
                        const fallbackResult = await model.generateContent({
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        { text: fallbackPrompt },
                                        { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
                                    ]
                                }
                            ]
                        });
                        const fallbackResponse = await fallbackResult.response;
                        const fallbackText = await fallbackResponse.text();
                        console.log("[Gemini] Fallback raw text output:", fallbackText);
                        try {
                            parsed = JSON.parse(fallbackText);
                        } catch {
                            parsed = { text: fallbackText };
                        }
                    }
                } else {
                    console.error("[Gemini] Did not return valid JSON:", text);
                    // Fallback: Try to extract just the raw text
                    const fallbackPrompt = `Extract all text from this PDF and return as JSON: { \"text\": \"...\" }`;
                    const fallbackResult = await model.generateContent({
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    { text: fallbackPrompt },
                                    { inlineData: { mimeType: "application/pdf", data: pdfBase64 } }
                                ]
                            }
                        ]
                    });
                    const fallbackResponse = await fallbackResult.response;
                    const fallbackText = await fallbackResponse.text();
                    console.log("[Gemini] Fallback raw text output:", fallbackText);
                    try {
                        parsed = JSON.parse(fallbackText);
                    } catch {
                        parsed = { text: fallbackText };
                    }
                }
            }
            return parsed;
        } catch (error) {
            console.error("[Gemini] Error from Gemini SDK:", error);
            throw error;
        }
    },
});

export const receiptScanningAgent = createAgent({
    name: "Receipt Scanning Agent",
    description: "Processes receipt PDFs to extract key information such as vendor names, dates, amounts, and line items",
    system: `You are an AI-powered receipt scanning assistant. Your primary role is to accurately extract and 
    structure relevant information from scanned receipts. Your task includes recognizing and parsing details 
    such as:
        •   Merchant Information: Store name, address, contact details
        •   Transaction Details: Date, time, receipt number, payment method
        •   Itemized Purchase: Product names, quantities, individual prices, discounts
        •   Total Amounts: Subtotal, taxes, total paid, and any applied discounts
        •   Ensure high accuracy by detecting OCR errors and correcting misread text when possible.
        •   Normalize dates, currency values, and formatting for consistency.
        •   If any key details are missing or unclear, return a structured response indicating incomplete data.
        •   Handle multiple formats, languages, and varying receipt layouts efficiently.
        •   Maintain a structured JSON output for easy integration with databases or expense tracking systems.
    `,
    tools: [parsePdfTool],
    model: require("@inngest/agent-kit").gemini({
        model: "gemini-2.5-pro",
        apiKey: process.env.GEMINI_API_KEY,
    }),
});