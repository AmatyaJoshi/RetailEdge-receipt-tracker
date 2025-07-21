import {
    createNetwork,
    getDefaultRoutingAgent,
    gemini,
} from "@inngest/agent-kit";
import { createServer } from "@inngest/agent-kit/server";
import { inngest } from "./client";
import Events from "./constants";
import { databaseAgent } from "./agents/databaseAgent";
import { receiptScanningAgent } from "./agents/receiptScanningAgent";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const defaultModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const agentNetwork = createNetwork({
    name: "Agent Team",
    agents: [
        databaseAgent, receiptScanningAgent
    ],
    defaultModel: gemini({
        model: "gemini-2.5-pro",
        apiKey: process.env.GEMINI_API_KEY,
    }),
    defaultRouter: ({network}) => {
        const savedToDatabase = network?.state.kv.get("saved-to-database");

        if (savedToDatabase !== undefined) {
            // Terminate the agent process if the data has been saved to the database
            return undefined;
        }

        return getDefaultRoutingAgent();
    }
})

export const server = createServer({
    agents: [databaseAgent, receiptScanningAgent],
    networks: [agentNetwork],
});

export const extractAndSavePDF = inngest.createFunction(
    {id: "Extract PDF and Save in Database"},
    {event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE},
    async ({event}) => {
        const result = await agentNetwork.run(
            `Extract the key data from this pdf: ${event.data.url}. Once the data is extracted, save it to the database using the
            receiptId: ${event.data.receiptId}. Once the receipt is successfully saved to the database you can terminate the agent
            process.`,
        );
        return await result.state.kv.get("receipt")
    }
)
