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
        if (network.state?.results && network.state.results.length > 0) {
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
        // Step 1: Get receipt information from database to access fileName
        const { ConvexHttpClient } = await import("convex/browser");
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        
        let receiptInfo;
        try {
            const { api } = await import("@/convex/_generated/api");
            receiptInfo = await convex.query(api.receipts.getReceiptByIdInternal, { id: event.data.receiptId });
        } catch (err) {
            console.error('[Gemini] Error fetching receipt info:', err);
            return { error: "Failed to fetch receipt information." };
        }

        if (!receiptInfo) {
            console.error('[Gemini] Receipt not found:', event.data.receiptId);
            return { error: "Receipt not found." };
        }

        // Step 2: Run the agent network to extract data from the PDF
        let result;
        try {
            console.log('[Gemini] Starting agent network with PDF URL:', event.data.url);
            result = await agentNetwork.run(
                `Extract the key data from this pdf: ${event.data.url}. Return the extracted data as JSON.`,
            );
            console.log('[Gemini] Agent network completed successfully');
        } catch (err) {
            console.error('[Gemini] Agent network execution failed:', err);
            return { error: "Failed to process PDF with AI agent." };
        }
        // Step 2: Parse the extracted data from the agent result
        let extractedData;
        try {
            console.log('[Gemini] Agent result state:', JSON.stringify(result.state, null, 2));
            
            const results = result.state?.results;
            if (!results || !Array.isArray(results) || results.length === 0) {
                throw new Error("No results found in agent network state");
            }
            
            const lastResult = results[results.length - 1];
            console.log('[Gemini] Last result:', JSON.stringify(lastResult, null, 2));
            
            // Check if we have tool calls with extracted data
            if (lastResult.toolCalls && Array.isArray(lastResult.toolCalls) && lastResult.toolCalls.length > 0) {
                // Get the last tool call result which should contain the extracted data
                const toolCall = lastResult.toolCalls[lastResult.toolCalls.length - 1];
                if (toolCall.content && typeof toolCall.content === 'object' && 'data' in toolCall.content) {
                    extractedData = (toolCall.content as any).data;
                    console.log('[Gemini] Extracted data from tool call:', extractedData);
                } else {
                    throw new Error("No data found in tool call result");
                }
            } else if (lastResult.output) {
                // Fallback to parsing output if no tool calls
                if (typeof lastResult.output === "string") {
                    const cleanedText = extractJsonFromCodeBlock(lastResult.output);
                    console.log('[Gemini] Cleaned JSON text:', cleanedText);
                    extractedData = JSON.parse(cleanedText);
                } else if (typeof lastResult.output === "object") {
                    extractedData = lastResult.output;
                } else {
                    throw new Error(`Unexpected output format from Gemini agent: ${typeof lastResult.output}`);
                }
            } else {
                throw new Error("No output or tool calls found in agent result");
            }
            
            console.log('[Gemini] Raw output:', extractedData);
        } catch (err) {
            console.error("Failed to parse extracted data from agent output:", err);
            console.error("Agent result structure:", JSON.stringify(result, null, 2));
            return { error: "Failed to extract data from receipt." };
        }
        // Step 2.5: Map Gemini output to expected format
        function mapGeminiToExpectedFormat(geminiData: any) {
            // Safely access nested properties with fallbacks
            const issuer = geminiData?.issuer || {};
            const issuedTo = geminiData?.issued_to || {};
            const lineItems = geminiData?.line_items || [];
            
            // Generate a comprehensive receipt summary
            const merchantName = issuer?.name || geminiData?.merchant_name || issuedTo?.name || 'Unknown Merchant';
            const transactionDate = geminiData?.date_issued || geminiData?.transaction_date || geminiData?.date || 'Unknown Date';
            const totalAmount = geminiData?.grand_total || geminiData?.total_amount || geminiData?.amount || 0;
            const currency = geminiData?.currency || '$';
            const itemCount = Array.isArray(lineItems) ? lineItems.length : 0;
            
            // Create brief paragraph summary
            let summary = `This receipt is from ${merchantName}`;
            
            if (geminiData?.merchant_address || issuer?.address || issuedTo?.address) {
                summary += ` located at ${geminiData?.merchant_address || issuer?.address || issuedTo?.address}`;
            }
            
            summary += ` for a transaction on ${transactionDate} totaling ${currency}${totalAmount}.`;
            
            if (itemCount > 0) {
                summary += ` The purchase included ${itemCount} item${itemCount > 1 ? 's' : ''}`;
                
                // Add key items
                if (itemCount <= 3) {
                    const itemNames = lineItems.map((item: any) => item?.description || item?.name).filter(Boolean);
                    if (itemNames.length > 0) {
                        summary += ` including ${itemNames.join(', ')}`;
                    }
                } else {
                    const firstThreeItems = lineItems.slice(0, 3).map((item: any) => item?.description || item?.name).filter(Boolean);
                    if (firstThreeItems.length > 0) {
                        summary += ` including ${firstThreeItems.join(', ')} and ${itemCount - 3} other item${itemCount - 3 > 1 ? 's' : ''}`;
                    }
                }
                summary += '.';
            }
            
            // Add insights
            const insights = [];
            if (totalAmount > 100) {
                insights.push('high-value purchase');
            }
            if (itemCount > 5) {
                insights.push('bulk shopping');
            }
            if (geminiData?.note?.bank_name || geminiData?.payment_method) {
                insights.push(`paid via ${geminiData?.note?.bank_name || geminiData?.payment_method}`);
            }
            
            if (insights.length > 0) {
                summary += ` This was a ${insights.join(' and ')} transaction.`;
            }
            
            summary += ' The receipt has been automatically processed and the data extracted for your records.';
            
            return {
                merchantName: issuer?.name || geminiData?.merchant_name || issuedTo?.name || '',
                merchantAddress: geminiData?.merchant_address || issuer?.address || issuedTo?.address || '',
                merchantContact: geminiData?.merchant_contact || geminiData?.merchant_phone || '',
                transactionDate: geminiData?.date_issued || geminiData?.transaction_date || geminiData?.date || '',
                transactionAmount: (geminiData?.grand_total || geminiData?.total_amount || geminiData?.amount || 0).toString(),
                currency: geminiData?.currency || '$',
                receiptSummary: summary,
                items: Array.isArray(lineItems) ? lineItems.map((item: any) => ({
                    name: item?.description || item?.name || '',
                    quantity: item?.qty || item?.quantity || 1,
                    unitPrice: item?.price || item?.unit_price || 0,
                    totalPrice: item?.subtotal || item?.total || item?.amount || 0,
                })) : [],
            };
        }

        // Map the extracted data to expected format
        const mappedData = mapGeminiToExpectedFormat(extractedData);

        // Step 3: Enhanced normalization and validation before saving
        function normalizeReceiptData(data: any, receiptId: string, fileDisplayName: string, originalData: any) {
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
                fileDisplayName: fileDisplayName, // Use the passed fileDisplayName instead of data.fileDisplayName
                receiptId,
                merchantName: toString(data.merchantName),
                merchantAddress: toString(data.merchantAddress),
                merchantContact: toString(data.merchantContact),
                transactionDate: toString(data.transactionDate),
                transactionAmount: toString(data.transactionAmount),
                receiptSummary: toString(data.receiptSummary),
                currency: toString(data.currency),
                items: toItems(data.items),
                rawExtractedData: JSON.stringify(originalData), // Use the original Gemini data
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
            normalizedData = normalizeReceiptData(mappedData, event.data.receiptId, receiptInfo.fileName, extractedData);
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
