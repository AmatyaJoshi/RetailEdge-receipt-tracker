import {
    createNetwork,
    getDefaultRoutingAgent,
    gemini,
} from "@inngest/agent-kit";
import { createServer } from "@inngest/agent-kit/server";
import { inngest } from "./client";
import Events from "./constants";
// import { databaseAgent } from "./agents/databaseAgent"; // No longer used
import { receiptScanningAgent } from "./agents/receiptScanningAgent";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveToDatabaseWithGemini } from "./agents/databaseAgent";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const defaultModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const agentNetwork = createNetwork({
    name: "Agent Team",
    agents: [
        receiptScanningAgent
    ],
    defaultModel: gemini({
        model: "gemini-2.5-pro",
        apiKey: process.env.GEMINI_API_KEY,
    }),
    defaultRouter: ({network}) => {
        // Only run the agent once per event
        if (network.state.results.length > 0) {
            return undefined; // Terminate after first run
        }
        return getDefaultRoutingAgent();
    }
})

export const server = createServer({
    agents: [receiptScanningAgent],
    networks: [agentNetwork],
});

// Utility to clean code block markers from Gemini output
function extractJsonFromCodeBlock(text: string): string {
    // Log the raw text for debugging
    console.log('[Gemini] Raw text before cleaning:', JSON.stringify(text));
    // Try to extract content between triple backticks (with or without 'json')
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
        return match[1].trim();
    }
    // Fallback: try to extract the first JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0].trim();
    }
    // Final fallback: remove stray backticks and trim
    return text.replace(/```json|```/g, '').trim();
}

export const extractAndSavePDF = inngest.createFunction(
    {id: "Extract PDF and Save in Database"},
    {event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE},
    async ({event}) => {
        // Step 1: Run the agent network to extract data from the PDF
        const result = await agentNetwork.run(
            `Extract the key data from this pdf: ${event.data.url}. Return the extracted data as JSON.`,
        );
        // Step 2: Parse the extracted data from the agent result
        let extractedData;
        try {
            const lastResult = result.state?.results?.[result.state?.results?.length - 1];
            if (lastResult && lastResult.output) {
                let extractedData;
                if (typeof lastResult.output === "string") {
                    // If output is a string, clean and parse
                    const cleanedText = extractJsonFromCodeBlock(lastResult.output);
                    console.log('[Gemini] Cleaned JSON text:', cleanedText);
                    extractedData = JSON.parse(cleanedText);
                } else if (typeof lastResult.output === "object") {
                    // If output is already an object, use it directly
                    extractedData = lastResult.output;
                } else {
                    throw new Error("Unexpected output format from Gemini agent");
                }
            } else {
                throw new Error("No extracted data found in agent output");
            }
        } catch (err) {
            console.error("Failed to parse extracted data from agent output:", err);
            return { error: "Failed to extract data from receipt." };
        }
        // Step 3: Enhanced normalization and validation before saving
        function normalizeReceiptData(data: any, receiptId: string) {
            // List of required fields (typed)
            const requiredFields: Array<keyof typeof normalized> = [
                'fileDisplayName', 'merchantName', 'merchantAddress', 'merchantContact',
                'transactionDate', 'transactionAmount', 'currency', 'items'
            ];
            // Helper to coerce to string
            const toString = (v: any) => (typeof v === 'string' ? v : (v == null ? '' : String(v)));
            // Helper to coerce to number
            const toNumber = (v: any) => {
                const n = Number(v);
                return isNaN(n) ? 0 : n;
            };
            // Helper to coerce to array of items, filter out empty/invalid
            const toItems = (arr: any): any[] => {
                if (!Array.isArray(arr)) return [];
                return arr
                    .map(item => ({
                        name: toString(item?.name),
                        quantity: toNumber(item?.quantity),
                        unitPrice: toNumber(item?.unitPrice),
                        totalPrice: toNumber(item?.totalPrice),
                    }))
                    .filter(item => item.name || item.quantity || item.unitPrice || item.totalPrice);
            };
            // Build normalized object
            const normalized = {
                fileDisplayName: toString(data.fileDisplayName),
                receiptId,
                merchantName: toString(data.merchantName),
                merchantAddress: toString(data.merchantAddress),
                merchantContact: toString(data.merchantContact),
                transactionDate: toString(data.transactionDate),
                transactionAmount: toString(data.transactionAmount),
                receiptSummary: toString(data.receiptSummary),
                currency: toString(data.currency),
                items: toItems(data.items),
                rawExtractedData: JSON.stringify(data),
            };
            // Log missing required fields
            const missing = requiredFields.filter(f => {
                const val = normalized[f];
                return !val || (Array.isArray(val) && val.length === 0);
            });
            if (missing.length > 0) {
                console.warn('[Gemini] Warning: Missing required fields:', missing);
            }
            // If all key fields are missing, return error
            const allEmpty = requiredFields.every(f => {
                const val = normalized[f];
                return !val || (Array.isArray(val) && val.length === 0);
            });
            if (allEmpty) {
                throw new Error('No key receipt fields could be extracted from the document.');
            }
            return normalized;
        }
        let normalizedData;
        try {
            normalizedData = normalizeReceiptData(extractedData, event.data.receiptId);
        } catch (err) {
            console.error('[Gemini] Normalization error:', err);
            return { error: 'Failed to extract any usable receipt data.' };
        }
        console.log('[Gemini] Normalized data to save:', normalizedData);
        const saveResult = await saveToDatabaseWithGemini(normalizedData);
        // Step 4: Update agent network state to indicate save is complete
        if (result.state && result.state.kv) {
            result.state.kv.set("saved-to-database", true);
            const receiptId = (saveResult.success && saveResult.data && typeof saveResult.data === "object" && "receiptId" in saveResult.data)
                ? (saveResult.data as any).receiptId
                : event.data.receiptId;
            if (receiptId) {
                result.state.kv.set("receipt", receiptId);
            }
        }
        // Step 5: Return the result (or trigger next steps/notifications as needed)
        return saveResult;
    }
)
