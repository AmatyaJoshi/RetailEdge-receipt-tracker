import { createAgent, createTool } from "@inngest/agent-kit";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
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

            // Flexible schema for receipts with optional fields and additional properties
            const flexibleReceiptSchema: Schema = {
                type: SchemaType.OBJECT,
                properties: {
                    invoice_id: { type: SchemaType.STRING, nullable: true },
                    date_issued: { type: SchemaType.STRING, nullable: true },
                    issued_to: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name: { type: SchemaType.STRING, nullable: true },
                            address: { type: SchemaType.STRING, nullable: true }
                        },
                        required: [],
                        nullable: true
                    },
                    line_items: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                no: { type: SchemaType.INTEGER, nullable: true },
                                description: { type: SchemaType.STRING, nullable: true },
                                qty: { type: SchemaType.INTEGER, nullable: true },
                                price: { type: SchemaType.NUMBER, nullable: true },
                                subtotal: { type: SchemaType.NUMBER, nullable: true }
                            },
                            required: [],
                            nullable: true
                        },
                        nullable: true
                    },
                    grand_total: { type: SchemaType.NUMBER, nullable: true },
                    currency: { type: SchemaType.STRING, nullable: true },
                    note: {
                        type: SchemaType.OBJECT,
                        properties: {
                            bank_name: { type: SchemaType.STRING, nullable: true },
                            account_no: { type: SchemaType.STRING, nullable: true }
                        },
                        required: [],
                        nullable: true
                    },
                    issuer: {
                        type: SchemaType.OBJECT,
                        properties: {
                            name: { type: SchemaType.STRING, nullable: true },
                            title: { type: SchemaType.STRING, nullable: true }
                        },
                        required: [],
                        nullable: true
                    }
                },
                required: [], // No required fields
                nullable: true
            };
            const promptText = `Extract all available key-value pairs and arrays from this receipt PDF. Return a single valid JSON object. If some fields are missing or extra, include whatever is present. Do not fail if some fields are missing. Use best effort to extract all structured data.`;
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
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: flexibleReceiptSchema
                }
            });
            const geminiResponse = await result.response;
            const text = await geminiResponse.text();
            console.log("[Gemini] Raw output:", text);
            // Output is guaranteed to be valid JSON (may have missing or extra fields)
            return JSON.parse(text);
        } catch (error) {
            console.error("[Gemini] Error from Gemini SDK:", error);
            throw error;
        }
    },
});

export const receiptScanningAgent = createAgent({
    name: "Receipt Scanning Agent",
    description: "Processes receipt PDFs to extract key information such as vendor names, dates, amounts, and line items. Handles variable receipt formats and missing/extra fields.",
    system: `You are an AI-powered receipt scanning assistant. Your primary role is to accurately extract and structure relevant information from scanned receipts. Your task includes recognizing and parsing details such as:
        •   Merchant Information: Store name, address, contact details
        •   Transaction Details: Date, time, receipt number, payment method
        •   Itemized Purchase: Product names, quantities, individual prices, discounts
        •   Total Amounts: Subtotal, taxes, total paid, and any applied discounts
        •   Ensure high accuracy by detecting OCR errors and correcting misread text when possible.
        •   Normalize dates, currency values, and formatting for consistency.
        •   If any key details are missing or unclear, return a structured response indicating incomplete data.
        •   Handle multiple formats, languages, and varying receipt layouts efficiently.
        •   Maintain a structured JSON output for easy integration with databases or expense tracking systems.
        •   If the receipt format is unknown, extract as much structured data as possible, even if some fields are missing or extra.
    `,
    tools: [parsePdfTool],
    model: require("@inngest/agent-kit").gemini({
        model: "gemini-2.5-pro",
        apiKey: process.env.GEMINI_API_KEY,
    }),
});