import axios from "axios";

function getOpenRouterConfig() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not set. Please set it in your environment.");
    }

    return {
        apiKey,
        model: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        httpReferer: process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3000",
        appTitle: process.env.OPENROUTER_APP_TITLE || "receipt-tracker",
    };
}

function cleanJsonText(text: string): string {
    const trimmed = text.trim();
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch?.[1]) {
        return codeBlockMatch[1].trim();
    }
    return trimmed;
}

async function extractTextFromPdf(pdfData: Uint8Array): Promise<string> {
    const { getDocument } = await import(/* webpackIgnore: true */ "pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = getDocument({
        data: pdfData,
        useWorkerFetch: false,
        isEvalSupported: false,
        stopAtErrors: false,
        disableFontFace: true,
        useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    let extractedText = "";

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((it: any) => (it.str || "")).join(" ");
        extractedText += `\n-- page ${i} --\n${pageText}`;
    }

    return extractedText.trim();
}

function getOutputText(content: unknown): string {
    if (Array.isArray(content)) {
        return content
            .map((part: any) => {
                if (typeof part === "string") return part;
                if (part && typeof part === "object") {
                    if ("text" in part && typeof part.text === "string") return part.text;
                    if ("content" in part && typeof part.content === "string") return part.content;
                }
                return "";
            })
            .join("");
    }

    if (typeof content === "string") {
        return content;
    }

    return "";
}

function getAssistantMessageText(message: any): string {
    if (!message || typeof message !== "object") return "";
    const candidates = [
        message.content,
        message.refusal,
        message.reasoning,
        message.text,
    ];
    for (const candidate of candidates) {
        const text = getOutputText(candidate);
        if (text.trim()) return text;
    }
    return "";
}

type OpenRouterFileContentPart = {
    type: "file";
    file: {
        fileData: string;
        filename: string;
    };
};

function createFileContentPart(pdfDataUrl: string): OpenRouterFileContentPart {
    return {
        type: "file",
        file: {
            fileData: pdfDataUrl,
            filename: "receipt.pdf",
        },
    };
}

export async function extractReceiptDataFromPdf(pdfUrl: string) {
    try {
        const openRouterConfig = getOpenRouterConfig();
        console.log("[OpenRouter] PDF URL:", pdfUrl);
        const pdfResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" });
        const pdfBuffer = Buffer.isBuffer(pdfResponse.data)
            ? pdfResponse.data
            : Buffer.from(pdfResponse.data);
        const pdfData = new Uint8Array(pdfBuffer);
        console.log("[OpenRouter] Downloaded PDF size:", pdfData.byteLength, "bytes");

        if (pdfData.byteLength === 0) {
            throw new Error("Downloaded PDF is empty. Check the file URL and storage.");
        }

        const [pdfFileContent, extractedText] = await Promise.all([
            Promise.resolve(createFileContentPart(`data:application/pdf;base64,${Buffer.from(pdfData).toString("base64")}`)),
            extractTextFromPdf(pdfData).catch((error) => {
                console.warn("[OpenRouter] PDF text extraction failed:", error);
                return "";
            }),
        ]);

        console.log("[OpenRouter] Extracted text length:", extractedText.length);

        const promptText = `Read this invoice or receipt and extract the visible information only. Return a single valid JSON object with this structure:
{
  "invoice_id": "string or null",
  "date_issued": "string or null",
  "issued_to": {"name": "string", "address": "string"},
  "line_items": [{"no": number, "description": "string", "qty": number, "price": number, "subtotal": number}],
  "grand_total": number,
  "currency": "string",
  "note": {"bank_name": "string", "account_no": "string"},
  "issuer": {"name": "string", "title": "string"},
  "summary": "a 3-4 line plain-language summary of the invoice or receipt"
}
Rules:
- Use only information that is clearly visible in the document.
- Do not guess or invent missing values.
- The summary must be a natural description of the invoice or receipt.
- Prefer 3 to 4 short lines separated by line breaks.
- Do not mention extraction, OCR, AI, JSON, confidence, or processing.
Return only JSON.
${extractedText ? `\nOCR text:\n${extractedText}` : ""}`;

        const { OpenRouter } = await import("@openrouter/sdk");
        const openrouter = new OpenRouter({
            apiKey: openRouterConfig.apiKey,
            httpReferer: openRouterConfig.httpReferer,
            appTitle: openRouterConfig.appTitle,
        });

        const response = await openrouter.chat.send({
            httpReferer: openRouterConfig.httpReferer,
            appTitle: openRouterConfig.appTitle,
            chatRequest: {
                model: openRouterConfig.model,
                stream: false,
                temperature: 0.1,
                maxCompletionTokens: 2000,
                messages: [
                    {
                        role: "system",
                        content:
                            "You extract invoice or receipt data and output only strict JSON. The summary must be a 3-4 line natural description of the document.",
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: promptText,
                            },
                            pdfFileContent,
                        ],
                    },
                ],
            },
        });

        const message = "choices" in response ? response.choices?.[0]?.message : undefined;
        const rawText = getAssistantMessageText(message);

        if (!rawText.trim()) {
            console.error("[OpenRouter] Empty assistant message:", JSON.stringify(message, null, 2));
            throw new Error("OpenRouter model returned an empty response.");
        }

        console.log("[OpenRouter] Raw output:", rawText);
        const cleanedText = cleanJsonText(rawText);

        try {
            return JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("[OpenRouter] Failed to parse JSON response:", parseError);
            console.error("[OpenRouter] Raw text:", rawText);
            throw new Error("Failed to parse OpenRouter response as JSON");
        }
    } catch (error) {
        console.error("[OpenRouter] Error from OpenRouter SDK:", error);
        throw error;
    }
}
