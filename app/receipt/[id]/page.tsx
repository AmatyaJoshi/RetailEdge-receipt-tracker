"use client";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ChevronLeft, FileText, Lightbulb, Lock, Sparkles } from "lucide-react";
import { useSchematicFlag } from "@schematichq/schematic-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { getFileDownloadUrl } from "@/actions/getFileDownloadUrl";
import { deleteReceipt } from "@/actions/deleteReceipt"

function Receipt() {
    const params = useParams<{ id: string }>();
    const [receiptId, setReceiptId] = useState<Id<"receipts"> | null>(null);
    const router = useRouter();
    const isSummariesEnabled = useSchematicFlag("summary");
    const [isLoadingDownload, setIsLoadingDownload] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch receipt details
    const receipt = useQuery(
        api.receipts.getReceiptById,
        receiptId ? { id: receiptId } : "skip",
    );

    // Get file download URL (for the view button)
    const fileId = receipt?.fileId;
    const downloadUrl = useQuery(
        api.receipts.getReceiptDownloadUrl,
        fileId ? { fileId } : "skip",
    );

    // Function to handle downloading the PDF using server action
    const handleDownload = async () => {
        if (!receipt || !receipt.fileId) return;

        try {
            setIsLoadingDownload(true)

            // Call the server action to get download URL
            const result = await getFileDownloadUrl(receipt.fileId);

            if (!result.success) {
                throw new Error(result.error);
            }

            // Create a temporary link and trigger download
            const link = document.createElement("a");
            if (result.downloadUrl) {
                link.href = result.downloadUrl;
                link.download = receipt.fileName || "receipt.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                throw new Error("No download URL found");
            }
        } catch (error) {
            console.error("Error downloading file:", error);
            alert("Failed to download the file. Please try again.");
        } finally {
            setIsLoadingDownload(false);
        }
    }

    // Function to delete receipt using server action
    const handleDeleteReceipt = async () => {
        if (!receiptId) return;

        if (
            window.confirm("Are you sure you want to delete this receipt? This action cannot be undone.",)
        ) {
            try {
                setIsDeleting(true);

                // Call the server action to delete the receipt
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
    }

    // Convert the URL string ID to a Convex ID
    useEffect(() => {
        try {
            const id = params.id as Id<"receipts">;
            setReceiptId(id);
        } catch (error) {
            console.error("Invalid receipt ID:", error);
            router.push("/")
        }
    }, [params.id, router]);

    // Loading...
    if (receipt === undefined) {
        return (
            <div className="container mx-auto py-10 px-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 
                    border-blue-600"></div>
                </div>
            </div>
        )
    }

    if (receipt === null) {
        return (
            <div className="container mx-auto py-10 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Receipt Not Found</h1>
                    <p className="mb-6">
                        The receipt you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Link href="/" className="px-6 py-2 text-white rounded bg-blue-500 hover:bg-blue-600">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    // Format upload date
    const uploadDate = new Date(receipt.uploadedAt).toLocaleString();

    // Check if receipt has extracted data
    const hasExtractedData = !!(
        receipt.merchantName ||
        receipt.merchantAddress ||
        receipt.transactionDate ||
        receipt.transactionAmount
    );

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <nav className="mb-6">
                    <Link
                        href="/receipts"
                        className="text-blue-500 hover:underline flex items-center"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Receipts
                    </Link>
                </nav>

                <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 truncate">
                                {receipt.fileDisplayName || receipt.fileName}
                            </h1>
                            <div className="flex items-center">
                                {receipt.status === "pending" ? (
                                    <div className="mr-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 
                                        border-yellow-800"></div>
                                    </div>
                                ) : null}
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${receipt.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : receipt.status === "processed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                >
                                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* {Information} */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">
                                        File Information
                                    </h3>
                                    <div className="mt-2 bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Uploaded</p>
                                                <p className="font-medium">{uploadDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Size</p>
                                                <p className="font-medium">{formatFileSize(receipt.size)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Type</p>
                                                <p className="font-medium">{receipt.mimeType}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">ID</p>
                                                <p className="font-medium truncate" title={receipt._id}>
                                                    {receipt._id.slice(0, 10)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download */}
                            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <FileText className="h-16 w-16 text-blue-500 mx-auto" />
                                    <p className="mt-4 text-sm text-gray-500">PDF Preview</p>
                                    {downloadUrl && (
                                        <a
                                            href={downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 px-4 py-2 text-white bg-blue-500 text-sm rounded
                                            hover:bg-blue-600 inline-block"
                                        >View PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Extracted Data Section */}
                        {hasExtractedData && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Receipt Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Merchant Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-700 mb-3">
                                            Merchant Information
                                        </h4>
                                        <div className="space-y-2">
                                            {receipt.merchantName && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Name</p>
                                                    <p className="font-medium">{receipt.merchantName}</p>
                                                </div>
                                            )}
                                            {receipt.merchantAddress && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Address</p>
                                                    <p className="font-medium">{receipt.merchantAddress}</p>
                                                </div>
                                            )}
                                            {receipt.merchantContact && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Contact</p>
                                                    <p className="font-medium">{receipt.merchantContact}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Transaction Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-700 mb-3">
                                            Transaction Details
                                        </h4>
                                        <div className="space-y-2">
                                            {receipt.transactionDate && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Date</p>
                                                    <p className="font-medium">
                                                        {receipt.transactionDate}
                                                    </p>
                                                </div>
                                            )}
                                            {receipt.transactionAmount && (
                                                <div>
                                                    <p className="text-sm text-gray-500">Amount</p>
                                                    <p className="font-medium">
                                                        {receipt.transactionAmount}{receipt.currency || ""}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Receipt Summary */}
                                {receipt.receiptSummary && (
                                    <>
                                        {isSummariesEnabled ? (
                                            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                                                <div className="flex items-center mb-4">
                                                    <h4 className="font-semibold text-blue-700">
                                                        AI Summary
                                                    </h4>
                                                    <div className="ml-2 flex">
                                                        <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                                                        <Sparkles className="h-3 w-3 text-yellow-400 -ml-1" />
                                                    </div>
                                                </div>
                                                <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-blue-100">
                                                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                                                        {receipt.receiptSummary}
                                                    </p>
                                                </div>
                                                <div className="mt-3 text-xs text-blue-600 italic flex items-center">
                                                    <Lightbulb className="h-3 w-3 mr-1" />
                                                    <span>
                                                        AI-generated summary based on receipt data
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-6 bg-gray-100 p-6 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center mb-4 justify-between">
                                                    <div className="flex items-center">
                                                        <h4 className="font-semibold text-gray-500">
                                                            AI Summary
                                                        </h4>
                                                        <div className="ml-2 flex">
                                                            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                                                            <Sparkles className="h-3 w-3 text-yellow-300 -ml-1" />
                                                        </div>
                                                    </div>
                                                    <Lock className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <Link
                                                        href="/manage-plan"
                                                        className="text-center py-4"
                                                    >
                                                        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            AI summary is a PRO level feature
                                                        </p>
                                                        <button className="mt-2 px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 inline-block">
                                                            Upgrade to Unlock
                                                        </button>
                                                    </Link>
                                                </div>
                                                <div className="mt-3 text-xs text-gray-400 italic flex items-center">
                                                    <Lightbulb className="h-3 w-3 mr-1" />
                                                    <span>
                                                        Get AI-powered insights from your receipts
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Items Section */}
                        {receipt.items && receipt.items.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-3">
                                    Items ({receipt.items.length})
                                </h4>
                                <div className="overflow-x-auto">
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
                                                            (sum, item) => sum + item.totalPrice, 0),
                                                        receipt.currency)}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* End of Extracted Data Section */}
                        {/* Actions */}
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">
                                Actions
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className={`px-4 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700
                                        ${isLoadingDownload
                                            ? "opacity-50 cursor-not-allowed"
                                            : "hover:bg-gray-50"}`}
                                    onClick={handleDownload}
                                    disabled={isLoadingDownload || !fileId}
                                >
                                    {isLoadingDownload ? "Downloading..." : "Download PDF"}
                                </button>
                                <button
                                    className={`px-4 py-2 rounded text-sm ${isDeleting
                                        ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
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
        </div>
    );
}

export default Receipt;

// Helper function to format file size
function formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

// Helper function to format currency
function formatCurrency(amount: number, currency: string = ""): string {
    return `${currency ? `${currency} ` : ""}${amount.toFixed(2)}`;
}
