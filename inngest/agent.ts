import { inngest } from "./client";
import Events from "./constants";
import { extractReceiptDataFromPdf } from "./agents/receiptScanningAgent";

function mapReceiptData(receiptData: any) {
    const issuer = receiptData?.issuer || {};
    const issuedTo = receiptData?.issued_to || {};
    const lineItems = receiptData?.line_items || [];

    const merchantName = issuer?.name || receiptData?.merchant_name || issuedTo?.name || "Unknown Merchant";
    const transactionDate = receiptData?.date_issued || receiptData?.transaction_date || receiptData?.date || "Unknown Date";
    const totalAmount = receiptData?.grand_total || receiptData?.total_amount || receiptData?.amount || 0;
    const currency = receiptData?.currency || "$";
    const itemCount = Array.isArray(lineItems) ? lineItems.length : 0;
    const itemNames = lineItems.map((item: any) => item?.description || item?.name).filter(Boolean);
    const itemPreview = itemNames.slice(0, 3).join(", ");
    const hasAddress = receiptData?.merchant_address || issuer?.address || issuedTo?.address;
    const hasItems = itemCount > 0;
    const hasTotal = totalAmount !== 0 && totalAmount !== "0";
    const providedSummary = typeof receiptData?.summary === "string" ? receiptData.summary.trim() : "";

    let summary = providedSummary;
    if (!summary) {
        const documentLabel = receiptData?.invoice_id ? "invoice" : "receipt";
        const subjectName = merchantName !== "Unknown Merchant" ? merchantName : "the listed merchant";
        const issuedToName = issuedTo?.name || receiptData?.merchant_name || "the recipient";
        const location = hasAddress ? ` at ${receiptData?.merchant_address || issuer?.address || issuedTo?.address}` : "";
        const dateLine = transactionDate !== "Unknown Date" ? `It is dated ${transactionDate}.` : "The document does not show a clear issue date.";
        const totalLine = hasTotal
            ? `The total shown is ${currency}${totalAmount}.`
            : "A clear total is not visible in the extracted data.";
        const itemsLine = hasItems
            ? `It includes ${itemPreview || `${itemCount} item${itemCount > 1 ? "s" : ""}`}${itemNames.length > 3 ? `, plus ${itemNames.length - 3} more item${itemNames.length - 3 > 1 ? "s" : ""}` : ""}.`
            : "No line items were identified with confidence.";
        summary = [
            `This ${documentLabel} appears to be from ${subjectName}${location} and is addressed to ${issuedToName}.`,
            dateLine,
            totalLine,
            itemsLine,
        ].join("\n");
    }

    return {
        merchantName: issuer?.name || receiptData?.merchant_name || issuedTo?.name || "",
        merchantAddress: receiptData?.merchant_address || issuer?.address || issuedTo?.address || "",
        merchantContact: receiptData?.merchant_contact || receiptData?.merchant_phone || "",
        transactionDate: receiptData?.date_issued || receiptData?.transaction_date || receiptData?.date || "",
        transactionAmount: String(receiptData?.grand_total || receiptData?.total_amount || receiptData?.amount || ""),
        currency: receiptData?.currency || "$",
        receiptSummary: summary,
        items: Array.isArray(lineItems)
            ? lineItems.map((item: any) => ({
                name: item?.description || item?.name || "",
                quantity: Number(item?.qty || item?.quantity || 1),
                unitPrice: Number(item?.price || item?.unit_price || 0),
                totalPrice: Number(item?.subtotal || item?.total || item?.amount || 0),
            }))
            : [],
    };
}

function normalizeReceiptData(data: any, receiptId: string, fileDisplayName: string, originalData: any) {
    const toString = (value: any) => (typeof value === "string" ? value : value == null ? "" : String(value));
    const toNumber = (value: any) => {
        const n = Number(value);
        return Number.isNaN(n) ? 0 : n;
    };
    const toItems = (arr: any): any[] => {
        if (!Array.isArray(arr)) return [];
        return arr
            .map((item) => ({
                name: toString(item?.name),
                quantity: toNumber(item?.quantity),
                unitPrice: toNumber(item?.unitPrice),
                totalPrice: toNumber(item?.totalPrice),
            }))
            .filter((item) => item.name || item.quantity || item.unitPrice || item.totalPrice);
    };

    const normalized = {
        fileDisplayName,
        receiptId,
        merchantName: toString(data.merchantName),
        merchantAddress: toString(data.merchantAddress),
        merchantContact: toString(data.merchantContact),
        transactionDate: toString(data.transactionDate),
        transactionAmount: toString(data.transactionAmount),
        receiptSummary: toString(data.receiptSummary),
        currency: toString(data.currency),
        items: toItems(data.items),
        rawExtractedData: JSON.stringify(originalData),
    };

    const requiredFields = [
        "fileDisplayName",
        "merchantName",
        "merchantAddress",
        "merchantContact",
        "transactionDate",
        "transactionAmount",
        "currency",
        "items",
    ] as const;

    const allEmpty = requiredFields.every((field) => {
        const value = normalized[field];
        return !value || (Array.isArray(value) && value.length === 0);
    });
    if (allEmpty) {
        throw new Error("No key receipt fields could be extracted from the document.");
    }

    return normalized;
}

function isRateLimitError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("too many requests");
}

async function markReceiptProcessingError(receiptId: string, errorMessage: string, rawExtractedData?: string) {
    const { api } = await import("@/convex/_generated/api");
    const { ConvexHttpClient } = await import("convex/browser");
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    await convex.mutation(api.receipts.updateReceiptProcessingError, {
        id: receiptId as any,
        errorMessage,
        rawExtractedData,
    });
}

async function saveReceiptExtraction(receiptId: string, data: ReturnType<typeof normalizeReceiptData>) {
    const { api } = await import("@/convex/_generated/api");
    const { ConvexHttpClient } = await import("convex/browser");
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    return convex.mutation(api.receipts.updateReceiptWithExtractedData, {
        id: receiptId as any,
        fileDisplayName: data.fileDisplayName,
        merchantName: data.merchantName,
        merchantAddress: data.merchantAddress,
        merchantContact: data.merchantContact,
        transactionDate: data.transactionDate,
        transactionAmount: data.transactionAmount,
        currency: data.currency,
        receiptSummary: data.receiptSummary,
        items: data.items,
        rawExtractedData: data.rawExtractedData,
    });
}

export const extractAndSavePDF = inngest.createFunction(
    { id: "Extract PDF and Save in Database" },
    { event: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE },
    async ({ event }) => {
        const { ConvexHttpClient } = await import("convex/browser");
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

        let receiptInfo;
        try {
            const { api } = await import("@/convex/_generated/api");
            receiptInfo = await convex.query(api.receipts.getReceiptByIdInternal, { id: event.data.receiptId });
        } catch (err) {
            console.error("[OpenRouter] Error fetching receipt info:", err);
            return { error: "Failed to fetch receipt information." };
        }

        if (!receiptInfo) {
            console.error("[OpenRouter] Receipt not found:", event.data.receiptId);
            return { error: "Receipt not found." };
        }

        let extractedData;
        try {
            console.log("[OpenRouter] Starting receipt extraction with PDF URL:", event.data.url);
            extractedData = await extractReceiptDataFromPdf(event.data.url);
            console.log("[OpenRouter] Receipt extraction completed successfully");
        } catch (err) {
            console.error("[OpenRouter] Receipt extraction failed:", err);
            if (isRateLimitError(err)) {
                await markReceiptProcessingError(
                    event.data.receiptId,
                    "AI processing is temporarily unavailable because the OpenRouter model hit a rate limit. The upload was saved, but extraction could not complete.",
                    JSON.stringify({ url: event.data.url, error: err instanceof Error ? err.message : String(err) }),
                );
                return { error: "OpenRouter rate limit exceeded." };
            }

            await markReceiptProcessingError(
                event.data.receiptId,
                "AI processing failed. The upload was saved, but extraction could not complete.",
                JSON.stringify({ url: event.data.url, error: err instanceof Error ? err.message : String(err) }),
            );
            return { error: "Failed to process PDF with AI model." };
        }

        let normalizedData;
        try {
            const mappedData = mapReceiptData(extractedData);
            normalizedData = normalizeReceiptData(mappedData, event.data.receiptId, receiptInfo.fileName, extractedData);
        } catch (err) {
            console.error("[OpenRouter] Normalization error:", err);
            await markReceiptProcessingError(
                event.data.receiptId,
                "The receipt was uploaded, but no usable receipt fields could be extracted.",
                JSON.stringify({ extractedData, error: err instanceof Error ? err.message : String(err) }),
            );
            return { error: "Failed to extract any usable receipt data." };
        }

        console.log("[OpenRouter] Normalized data to save:", normalizedData);

        try {
            const saveResult = await saveReceiptExtraction(event.data.receiptId, normalizedData);
            return saveResult;
        } catch (err) {
            console.error("[OpenRouter] Save-to-database failed:", err);
            await markReceiptProcessingError(
                event.data.receiptId,
                "Receipt data was extracted, but saving it to the database failed.",
                JSON.stringify({ extractedData: normalizedData, error: err instanceof Error ? err.message : String(err) }),
            );
            return { error: "Failed to save extracted receipt data." };
        }
    },
);
