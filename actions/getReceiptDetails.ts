"use server";

import { auth } from "@clerk/nextjs/server";
import convex from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export async function getReceiptDetails(receiptId: string) {
    try {
        const { userId, getToken } = await auth();

        if (!userId) {
            return {
                success: false,
                error: "Please sign in to view this receipt.",
            };
        }

        const token = await getToken({ template: "convex" });
        if (!token) {
            return {
                success: false,
                error: "Unable to authenticate with Convex.",
            };
        }

        convex.setAuth(token);

        const receipt = await convex.query(api.receipts.getReceiptById, {
            id: receiptId as Id<"receipts">,
        }) as Doc<"receipts"> | null;

        if (!receipt) {
            return {
                success: false,
                error: "The receipt you&apos;re looking for doesn&apos;t exist or has been removed.",
            };
        }

        const downloadUrl = receipt.fileId
            ? await convex.query(api.receipts.getReceiptDownloadUrl, {
                fileId: receipt.fileId,
            })
            : null;

        return {
            success: true,
            receipt,
            downloadUrl,
        };
    } catch (error) {
        console.error("Error loading receipt details:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to load the receipt.",
        };
    }
}
