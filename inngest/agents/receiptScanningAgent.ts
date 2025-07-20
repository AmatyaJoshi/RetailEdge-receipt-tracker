import { createAgent, createTool } from "@inngest/agent-kit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import { createCanvas } from "canvas";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
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

            // Convert first page of PDF to image (base64 PNG)
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext("2d");
            // Render the PDF page to the canvas
            await page.render({ canvasContext: context as any, viewport }).promise;
            const imageBuffer = canvas.toBuffer("image/png");
            const imageBase64 = imageBuffer.toString("base64");

            const promptText = `Extract the data from this receipt image and return the structured output as follows:
            {
                "merchant": { "name": "Store Name", "address": "123 Main St, City, Country", "contact": "+123456789" },
                "transaction": { "date": "DD-MM-YYYY", "time": "HH:MM", "receipt_number": "ABC123456", "payment_method": "Credit Card" },
                "items": [ { "name": "Item 1", "quantity": 2, "unit_price": 10.00, "total_price": 20.00 } ],
                "totals": { "subtotal": 30.00, "tax": 3.00, "total": 33.00, "currency": "INR" }
            }
            `;

            // Use Gemini's vision API to analyze the image and prompt
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptText },
                            { inlineData: { mimeType: "image/png", data: imageBase64 } }
                        ]
                    }
                ]
            });
            const geminiResponse = await result.response;
            const text = await geminiResponse.text();
            return { model: "gemini-2.5-pro", data: text };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
});

export const receiptScanningAgent = createAgent({
    name: "Receipt Scanning Agent",
    description: "Processes receipt images and PDFs to extract key information such as vendor names, dates, amounts, and line items",
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
    // No model property needed, handled in tool
    tools: [parsePdfTool]
});