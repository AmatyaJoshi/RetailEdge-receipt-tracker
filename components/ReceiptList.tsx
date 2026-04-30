"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { clearReceiptHistory } from "@/actions/clearReceiptHistory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Doc } from "@/convex/_generated/dataModel";
import { ChevronRight, FileText, Trash2 } from "lucide-react";
import { useState } from "react";

function ReceiptList() {
  const { user } = useUser();
  const [isClearing, setIsClearing] = useState(false);
  const receipts = useQuery(api.receipts.getReceipts, {
    userId: user?.id || "",
  });
  const receiptCount = receipts?.length ?? 0;

  const handleClearHistory = async () => {
    if (!receipts || receipts.length === 0) return;

    const confirmed = window.confirm(
      "Clear all saved receipts? This will permanently delete the uploaded files and extracted records.",
    );
    if (!confirmed) return;

    try {
      setIsClearing(true);
      const result = await clearReceiptHistory();

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error clearing receipt history:", error);
      alert("Failed to clear receipt history. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  if (!user) {
    return (
      <div className="surface-card w-full p-8 text-center">
        <p className="text-slate-600">Please sign in to view your receipts.</p>
      </div>
    );
  }

  if (!receipts) {
    return (
      <div className="surface-card w-full p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
        <p className="mt-3 text-slate-600">Loading receipts...</p>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="surface-card w-full p-8 text-center">
        <p className="text-slate-600">No receipts have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="surface-card w-full overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Receipts</h2>
          <p className="mt-1 text-sm text-slate-500">Recent uploads and processing status.</p>
        </div>
        {receiptCount > 0 && (
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              isClearing
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
            onClick={handleClearHistory}
            disabled={isClearing}
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? "Clearing..." : "Clear history"}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
    {receipts.map((receipt: Doc<"receipts">) => (
              <TableRow
                key={receipt._id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => (window.location.href = `/receipt/${receipt._id}`)}
              >
                <TableCell className="py-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                </TableCell>
                <TableCell className="font-medium text-slate-900">
                  {receipt.fileDisplayName || receipt.fileName}
                </TableCell>
                <TableCell className="text-slate-600">
                  {new Date(receipt.uploadedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-slate-600">{formatFileSize(receipt.size)}</TableCell>
                <TableCell className="text-slate-600">
                  {receipt.transactionAmount
                    ? `${receipt.transactionAmount} ${receipt.currency || ""}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      receipt.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : receipt.status === "processed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default ReceiptList;

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
