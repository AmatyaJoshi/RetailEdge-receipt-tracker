"use client"

import { uploadPDF } from "@/actions/uploadPDF";
import { useUser } from "@clerk/clerk-react";
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import { Button } from "./ui/button";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { AlertCircle, CheckCircle, CloudUpload, FileText, Database, Cpu } from "lucide-react";
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

    // Initialize sensors
    const sensors = useSensors(
        useSensor(PointerSensor)
    );

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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }

        if (featureUsageExceeded) {
            alert("You have exceeded your scan limit");

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
        <DndContext sensors={sensors}>
            <div className="w-full max-w-3xl mx-auto">
                <motion.div
                    onDragOver={canUpload ? handleDragOver : undefined}
                    onDragLeave={canUpload ? handleDragLeave : undefined}
                    onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center 
                    transition-all duration-300 group cursor-pointer ${
                        isDraggingOver 
                            ? "border-blue-500 bg-blue-500/10 scale-105 shadow-2xl shadow-blue-500/20" 
                            : "border-slate-600 hover:border-blue-400 hover:bg-slate-800/30"
                    } ${!canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
                    whileHover={canUpload ? { scale: 1.02 } : {}}
                    whileTap={canUpload ? { scale: 0.98 } : {}}
                >
                    {/* Background gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Animated border glow */}
                    <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                        isDraggingOver 
                            ? 'ring-4 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                            : 'ring-0'
                    }`} />

                    <div className="relative z-10">
                        {isUploading ? (
                            <motion.div 
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 border-4 border-slate-600 rounded-full" />
                                    <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <motion.p 
                                    className="text-lg font-medium text-white"
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    Processing Document...
                                </motion.p>
                                <p className="text-sm text-slate-400 mt-2">
                                    Our AI is extracting and analyzing your receipt data
                                </p>
                            </motion.div>
                        ) : !isUserSignedIn ? (
                            <motion.div 
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center border border-slate-600">
                                        <Database className="h-12 w-12 text-slate-400" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Authentication Required
                                </h3>
                                <p className="text-slate-400 max-w-sm">
                                    Please sign in to access our enterprise document processing platform
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Professional icon with gradient background */}
                                <div className="relative mb-6">
                                    <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300 border border-blue-500/20">
                                        <FileText className="h-14 w-14 text-white" />
                                    </div>
                                    {/* Subtle processing indicator */}
                                    <motion.div 
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center"
                                        animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [0.8, 1, 0.8]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Cpu className="h-3 w-3 text-white" />
                                    </motion.div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Document Processing Zone
                                </h3>
                                <p className="text-slate-300 max-w-md mb-6 leading-relaxed">
                                    Upload your receipts for instant AI-powered data extraction, categorization, and analysis. 
                                    Enterprise-grade processing with 99.9% accuracy.
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
                                    className={`px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                        isFeatureEnabled 
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl border border-blue-500/20' 
                                            : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white cursor-not-allowed opacity-70'
                                    }`}
                                    disabled={!isFeatureEnabled}
                                    onClick={triggerFileInput}
                                >
                                    {isFeatureEnabled ? (
                                        <span className="flex items-center">
                                            <CloudUpload className="h-5 w-5 mr-2" />
                                            Process Documents
                                        </span>
                                    ) : (
                                        "Upgrade Required"
                                    )}
                                </Button>

                                <p className="text-xs text-slate-500 mt-4">
                                    Supports PDF files up to 25MB • Enterprise-grade security
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
                            <div className="flex items-center p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-700/50 rounded-xl text-red-300 shadow-lg">
                                <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Processing Limit Reached</p>
                                    <p className="text-sm opacity-90">
                                        You've used {featureAllocation} scans. Upgrade your plan to continue processing documents.
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
                            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 shadow-lg">
                                <h3 className="font-semibold text-white mb-3 flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                    Successfully Processed
                                </h3>
                                <ul className="space-y-2">
                                    {uploadedFiles.map((fileName, i) => (
                                        <motion.li 
                                            key={i} 
                                            className="flex items-center text-sm text-slate-300"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                                            {fileName}
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DndContext>
    );
}

export default PDFDropzone