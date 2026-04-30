"use client"

import { uploadPDF } from "@/actions/uploadPDF";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { AlertCircle, CheckCircle, CloudUpload, FileText, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function PDFDropzone() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { user } = useUser();
    const {
        value: isFeatureEnabled,
        featureUsageExceeded,
        featureAllocation
    } = useSchematicEntitlement("scans")

    const handleUpload = useCallback(async (files: FileList | File[]) => {
        if (!user) {
            alert("Please sign in to upload files");
            return;
        }

        const fileArray = Array.from(files);
        const pdfFiles = fileArray.filter(
            (file) =>
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf"));

        if (pdfFiles.length === 0) {
            alert("Please select drop only PDF files.");
            return;
        }

        setIsUploading(true);
        try {
            // Upload files
            const newUploadedFiles: string[] = [];

            for (const file of pdfFiles) {
                // Create a FormData object to use with the server action
                const formData = new FormData();
                formData.append("file", file);

                // Call the server action to handle the upload
                const result = await uploadPDF(formData);

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Redirect to the receipt details page after successful upload
                if (result.data && result.data.receiptId) {
                    router.push(`/receipt/${result.data.receiptId}`);
                    return; // Stop after first successful upload
                }

                newUploadedFiles.push(file.name);

                setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);

                // Clear the uploaded files list after 5 seconds
                setTimeout(() => {
                    setUploadedFiles([]);
                }, 5000);

            }
        } catch (error) {
            console.error("Upload failed", error);
            alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,)
        } finally {
            setIsUploading(false);
        };

    }, [user, router]);

    // Handle file drop via native browser events for better PDF support
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);

        if (!user) {
            alert("Please sign in to upload files");
            return;
        }

        if (featureUsageExceeded) {
            alert("You have exceeded your scan limit");
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    }, [user, handleUpload, featureUsageExceeded]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            handleUpload(e.target.files);
        }
    }, [handleUpload]
    );

    const isUserSignedIn = !!user;
    const canUpload = isUserSignedIn && isFeatureEnabled;

    return (
        <div className="w-full">
                <motion.div
                    onDragOver={canUpload ? handleDragOver : undefined}
                    onDragLeave={canUpload ? handleDragLeave : undefined}
                    onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
                    className={`rounded-2xl border border-dashed p-6 text-center transition-colors ${
                        isDraggingOver ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                    } ${!canUpload ? "opacity-60" : ""}`}
                    whileHover={canUpload ? { y: -2 } : {}}
                >
                    <div className="relative z-10">
                        {isUploading ? (
                            <motion.div className="flex flex-col items-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-4 h-10 w-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
                                <p className="text-sm font-medium text-slate-950">Processing receipt</p>
                                <p className="mt-1 text-sm text-slate-500">Extracting text and saving the result.</p>
                            </motion.div>
                        ) : !isUserSignedIn ? (
                            <motion.div className="flex flex-col items-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <Database className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-950">Sign in to upload</h3>
                                <p className="mt-1 max-w-sm text-sm text-slate-500">Upload a PDF receipt and let the system extract the details automatically.</p>
                            </motion.div>
                        ) : (
                            <motion.div className="flex flex-col items-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="mb-4 rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
                                    <FileText className="h-8 w-8" />
                                </div>

                                <h3 className="text-lg font-semibold text-slate-950">
                                    Drop a PDF here
                                </h3>
                                <p className="mt-1 max-w-md text-sm text-slate-500">
                                    Or choose a file to upload. We support PDF receipts only.
                                </p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="application/pdf,.pdf"
                                    multiple
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                                
                                <Button
                                    className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-white hover:bg-slate-800"
                                    disabled={!isFeatureEnabled}
                                    onClick={triggerFileInput}
                                >
                                    <CloudUpload className="mr-2 h-4 w-4" />
                                    {isFeatureEnabled ? "Choose PDF" : "Upgrade required"}
                                </Button>

                                <p className="mt-3 text-xs text-slate-400">
                                    PDF only · secure upload
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Feature usage exceeded warning */}
                <AnimatePresence>
                    {featureUsageExceeded && (
                        <motion.div 
                            className="mt-6"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                                <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Processing Limit Reached</p>
                                    <p className="text-sm opacity-90">
                                        You&apos;ve used {featureAllocation} scans. Upgrade your plan to continue processing documents.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Uploaded files list */}
                <AnimatePresence>
                    {uploadedFiles.length > 0 && (
                        <motion.div 
                            className="mt-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="surface-card p-4 shadow-sm">
                                <h3 className="mb-3 flex items-center font-semibold text-slate-950">
                                    <CheckCircle className="mr-2 h-5 w-5 text-emerald-500" />
                                    Successfully Processed
                                </h3>
                                <ul className="space-y-2">
                                    {uploadedFiles.map((fileName, i) => (
                                        <motion.li 
                                            key={i} 
                                            className="flex items-center text-sm text-slate-600"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className="mr-3 h-2 w-2 rounded-full bg-emerald-500" />
                                            {fileName}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
    );
}

export default PDFDropzone
