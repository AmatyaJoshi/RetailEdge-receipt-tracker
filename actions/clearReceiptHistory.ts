"use server";

import { currentUser } from "@clerk/nextjs/server";
import convex from "@/lib/convexClient";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function clearReceiptHistory() {
    const user = await currentUser();

    if (!user) {
        return {
            success: false,
            error: "Unauthorized",
        };
    }

    try {
        const receipts = await convex.query(api.receipts.getReceipts, {
            userId: user.id,
        });

        for (const receipt of receipts) {
            await convex.mutation(api.receipts.deleteReceipt, {
                id: receipt._id as Id<"receipts">,
            });
        }

        return {
            success: true,
            deletedCount: receipts.length,
        };
    } catch (error) {
        console.error("Error clearing receipt history:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
}
