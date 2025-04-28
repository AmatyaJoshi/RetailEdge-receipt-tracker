"use server";

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server";
import { getFileDownloadUrl } from "./getFileDownloadUrl";
import Events from "@/inngest/constants";
import { inngest } from "@/inngest/client";

// Server action to upload a PDF file to Convex Storage

export async function uploadPDF(formData: FormData) {
    const user = await currentUser();

    if (!user) {
        return {
            success: false,
            error: "Unauthorized"
        };
    }
    try {
        //Get the file from the form data
        const file = formData.get("file") as File;
        if (!file) {
            return {
                success: false,
                error: "No file provided"
            };
        }

        // Validate the file type
        if (
            !file.type.includes("pdf") &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            return {
                success: false,
                error: "Invalid file type: Only PDF files are allowed"
            };
        }

        // Upload the file to Convex Storage
        const uploadUrl = await convex.mutation(api.receipts.generateUploadUrl, {});

        // Convert file to arrayBuffer for fetch API
        const arrayBuffer = await file.arrayBuffer();

        // Upload the file to Convex Storage
        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": file.type,
            },
            body: new Uint8Array(arrayBuffer),
        });

        if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
        }

        // Get storage ID from response
        const { storageId } = await uploadResponse.json();

        // Add receipt to database
        const receiptId = await convex.mutation(api.receipts.storeReceipt, {
            userId: user.id,
            fileName: file.name,
            fileId: storageId,
            size: file.size,
            mimeType: file.type,
        });

        // Generate the file URL
        const fileUrl = await getFileDownloadUrl(storageId);

        // TODO: Trigger inngest agent flow
        await inngest.send({
            name: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE,
            data: {
                url: fileUrl.downloadUrl,
                receiptId,
            },
        })

        return {
            success: true,
            data: {
                receiptId,
                fileName: file.name,
            }
        }

    } catch (error) {
        console.error("Server action upload error:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "An unknown error occurred"
        };
    }
}
