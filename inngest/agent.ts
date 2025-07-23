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
    // Extract content between the first pair of triple backticks, if present
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
        return match[1].trim();
    }
    // Fallback: remove any stray backticks and trim
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
            if (lastResult && lastResult.output && lastResult.output.length > 0) {
                const text = lastResult.output.map((msg: any) => msg.content).join("\n");
                const cleanedText = extractJsonFromCodeBlock(text);
                console.log('[Gemini] Cleaned JSON text:', cleanedText); // Debug log
                if (typeof cleanedText === "string") {
                    extractedData = JSON.parse(cleanedText);
                } else {
                    extractedData = cleanedText;
                }
            } else {
                throw new Error("No extracted data found in agent output");
            }
        } catch (err) {
            console.error("Failed to parse extracted data from agent output:", err);
            return { error: "Failed to extract data from receipt." };
        }
        // Step 3: Call Gemini function calling to save to database
        const saveResult = await saveToDatabaseWithGemini({
            ...extractedData,
            receiptId: event.data.receiptId,
        });
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
