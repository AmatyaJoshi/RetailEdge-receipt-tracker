"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ChevronLeft, FileText, Lightbulb, Sparkles } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getFileDownloadUrl } from "@/actions/getFileDownloadUrl";
import { deleteReceipt } from "@/actions/deleteReceipt";
import { getReceiptDetails } from "@/actions/getReceiptDetails";

function Receipt() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const receiptId = useMemo(() => {
        const id = params.id;
        return typeof id === "string" ? (id as Id<"receipts">) : null;
    }, [params.id]);
    const [receipt, setReceipt] = useState<Doc<"receipts"> | null | undefined>(undefined);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoadingDownload, setIsLoadingDownload] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let pollTimeout: ReturnType<typeof setTimeout> | null = null;

        const loadReceipt = async () => {
            if (!receiptId) {
                setLoadError("Invalid receipt ID.");
                setReceipt(null);
                return;
            }

            const result = await getReceiptDetails(receiptId);

            if (cancelled) return;

            if (!result.success) {
                setLoadError(result.error ?? "Failed to load the receipt.");
                setReceipt(null);
                return;
            }

            setLoadError(null);
            setReceipt(result.receipt);
            setDownloadUrl(result.downloadUrl ?? null);

            if (result.receipt?.status === "pending") {
                pollTimeout = setTimeout(() => {
                    void loadReceipt();
                }, 3000);
            }
        };

        void loadReceipt();

        return () => {
            cancelled = true;
            if (pollTimeout) {
                clearTimeout(pollTimeout);
            }
        };
    }, [receiptId]);

    const handleDownload = async () => {
        if (!receipt || !receipt.fileId) return;

        try {
            setIsLoadingDownload(true);
            const result = await getFileDownloadUrl(receipt.fileId);

            if (!result.success) {
                throw new Error(result.error);
            }

            if (!result.downloadUrl) {
                throw new Error("No download URL found");
            }

            const link = document.createElement("a");
            link.href = result.downloadUrl;
            link.download = receipt.fileName || "receipt.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Failed to download the file. Please try again.");
        } finally {
            setIsLoadingDownload(false);
        }
    };

    const handleDeleteReceipt = async () => {
        if (!receiptId) return;

        if (
            window.confirm("Are you sure you want to delete this receipt? This action cannot be undone.")
        ) {
            try {
                setIsDeleting(true);
                const result = await deleteReceipt(receiptId);

                if (!result.success) {
                    throw new Error(result.error);
                }

                router.push("/receipts");
            } catch (error) {
                console.error("Error deleting receipt:", error);
                alert("Failed to delete the receipt. Please try again.");
                setIsDeleting(false);
            }
        }
    };

    if (receipt === undefined) {
        return (
            <div className="container mx-auto px-4 py-10">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600" />
                    {loadError ? <p className="text-sm text-slate-500">{loadError}</p> : null}
                </div>
            </div>
        );
    }

    if (receipt === null) {
        return (
            <div className="container mx-auto px-4 py-10">
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="mb-4 text-2xl font-bold">Receipt Not Found</h1>
                    <p className="mb-6">
                        {loadError || "The receipt you&apos;re looking for doesn&apos;t exist or has been removed."}
                    </p>
                    <Link href="/" className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const uploadDate = new Date(receipt.uploadedAt).toLocaleString();
    const hasExtractedData = !!(
        receipt.merchantName ||
        receipt.merchantAddress ||
        receipt.transactionDate ||
        receipt.transactionAmount
    );
    const hasSummary = !!receipt.receiptSummary;

    return (
        <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <nav className="mb-6">
                    <Link
                        href="/receipts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to receipts
                    </Link>
                </nav>

                <div className="surface-card overflow-hidden">
                    <div className="border-b border-slate-200 px-6 py-5 md:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                                <p className="section-label">Receipt detail</p>
                                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                                    {receipt.fileDisplayName || receipt.fileName}
                                </h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Uploaded {uploadDate} · {formatFileSize(receipt.size)}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {receipt.status === "pending" ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                                ) : null}
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                        receipt.status === "pending"
                                            ? "bg-amber-50 text-amber-700"
                                            : receipt.status === "processed"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-rose-50 text-rose-700"
                                    }`}
                                >
                                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 border-b border-slate-200 px-6 py-6 md:grid-cols-[1.1fr_0.9fr] md:px-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                                File information
                            </h3>
                            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Uploaded</p>
                                    <p className="mt-1 font-medium text-slate-950">{uploadDate}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Size</p>
                                    <p className="mt-1 font-medium text-slate-950">{formatFileSize(receipt.size)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Type</p>
                                    <p className="mt-1 truncate font-medium text-slate-950">{receipt.mimeType}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">ID</p>
                                    <p className="mt-1 truncate font-medium text-slate-950" title={receipt._id}>
                                        {receipt._id.slice(0, 10)}...
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                            <div>
                                <FileText className="mx-auto h-14 w-14 text-slate-400" />
                                <p className="mt-4 text-sm font-medium text-slate-950">PDF preview</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Open the source file in a new tab for a quick check.
                                </p>
                                {downloadUrl && (
                                    <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                                    >
                                        View PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {receipt.status === "error" && (
                        <div className="px-6 pt-6 md:px-8">
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                                <p className="font-semibold">Processing needs attention</p>
                                <p className="mt-1 text-sm">
                                    We saved the upload, but the AI extractor could not complete normally. You can still review the file and the summary below.
                                </p>
                            </div>
                        </div>
                    )}

                    {hasSummary && (
                        <div className="px-6 pt-6 md:px-8">
                            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <h4 className="font-semibold text-blue-700">AI Summary</h4>
                                    <div className="flex">
                                        <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                                        <Sparkles className="-ml-1 h-3 w-3 text-yellow-400" />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-blue-100 bg-white/80 p-4">
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                        {receipt.receiptSummary}
                                    </p>
                                </div>
                                <div className="mt-3 flex items-center text-xs italic text-blue-600">
                                    <Lightbulb className="mr-1 h-3 w-3" />
                                    <span>AI-generated summary based on receipt data</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {hasExtractedData && (
                        <div className="px-6 py-6 md:px-8">
                            <h3 className="text-lg font-semibold text-slate-950">Receipt Details</h3>

                            <div className="mt-4 grid gap-6 md:grid-cols-2">
                                <div className="surface-card p-5">
                                    <h4 className="mb-3 font-medium text-slate-700">
                                        Merchant Information
                                    </h4>
                                    <div className="space-y-2">
                                        {receipt.merchantName && (
                                            <div>
                                                <p className="text-sm text-slate-500">Name</p>
                                                <p className="font-medium text-slate-950">{receipt.merchantName}</p>
                                            </div>
                                        )}
                                        {receipt.merchantAddress && (
                                            <div>
                                                <p className="text-sm text-slate-500">Address</p>
                                                <p className="font-medium text-slate-950">{receipt.merchantAddress}</p>
                                            </div>
                                        )}
                                        {receipt.merchantContact && (
                                            <div>
                                                <p className="text-sm text-slate-500">Contact</p>
                                                <p className="font-medium text-slate-950">{receipt.merchantContact}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="surface-card p-5">
                                    <h4 className="mb-3 font-medium text-slate-700">
                                        Transaction Details
                                    </h4>
                                    <div className="space-y-2">
                                        {receipt.transactionDate && (
                                            <div>
                                                <p className="text-sm text-slate-500">Date</p>
                                                <p className="font-medium text-slate-950">
                                                    {receipt.transactionDate}
                                                </p>
                                            </div>
                                        )}
                                        {receipt.transactionAmount && (
                                            <div>
                                                <p className="text-sm text-slate-500">Amount</p>
                                                <p className="font-medium text-slate-950">
                                                    {receipt.currency || "$"} {receipt.transactionAmount}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {receipt.items && receipt.items.length > 0 && (
                        <div className="px-6 pb-6 md:px-8">
                            <h4 className="mb-3 font-medium text-slate-700">
                                Items ({receipt.items.length})
                            </h4>
                            <div className="surface-card overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Unit Price</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipt.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>
                                                    {formatCurrency(item.unitPrice, receipt.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(item.totalPrice, receipt.currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-right">
                                                Total
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(
                                                    receipt.items.reduce(
                                                        (sum, item) => sum + item.totalPrice,
                                                        0,
                                                    ),
                                                    receipt.currency,
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-200 px-6 py-6 md:px-8">
                        <h3 className="mb-4 text-sm font-medium text-slate-500">
                            Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            <button
                                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                                    isLoadingDownload
                                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                                onClick={handleDownload}
                                disabled={isLoadingDownload || !receipt.fileId}
                            >
                                {isLoadingDownload ? "Downloading..." : "Download PDF"}
                            </button>
                            <button
                                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                                    isDeleting
                                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                        : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                }`}
                                onClick={handleDeleteReceipt}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Receipt"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Receipt;

function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCurrency(amount: number, currency: string = ""): string {
    return `${currency ? `${currency} ` : ""}${amount.toFixed(2)}`;
}
