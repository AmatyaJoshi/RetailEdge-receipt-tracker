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
            // Download the PDF
            const pdfResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" });
            const pdfData = Buffer.from(pdfResponse.data, "binary");
            const pdfBase64 = pdfData.toString("base64");

            // Improved prompt for reliable JSON extraction
            const promptText = `Extract the following fields from this receipt PDF and return them as a single JSON object with these exact keys: merchantName, merchantAddress, merchantContact, transactionDate, transactionAmount, currency, receiptSummary, and items (an array of {name, quantity, unitPrice, totalPrice}). Only output valid JSON.\n\nPDF:`;

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
            // Log the raw output for debugging
            console.log("Gemini raw output:", text);
            // Try to parse as JSON
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                console.error("Gemini did not return valid JSON:", text);
                throw new Error("Gemini did not return valid JSON");
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