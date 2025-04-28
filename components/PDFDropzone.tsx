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
import { AlertCircle, CheckCircle, CloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

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
            <div className="w-full max-w-md mx-auto">
                <div
                    onDragOver={canUpload ? handleDragOver : undefined}
                    onDragLeave={canUpload ? handleDragLeave : undefined}
                    onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center 
                    transition-colors ${isDraggingOver ? "border-blue-500 bg-blue-50" :
                            "border-gray-300"
                        } ${!canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 
                            border-blue-500 mb-2"></div>
                            <p>Uploading...</p>
                        </div>
                    ) : !isUserSignedIn ? (
                        <>
                            <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                Please sign in to upload files
                            </p>
                        </>
                    ) : (
                        <>
                            <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                Drag and drop your PDF files here or click to select files
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
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isFeatureEnabled}
                                onClick={triggerFileInput}
                            >
                                {isFeatureEnabled ? "Select files" : "Upgrade to upload"}
                            </Button>
                        </>
                    )}

                </div>

                <div className="mt-4">
                    {featureUsageExceeded && (
                        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <span>
                                You have exceeded your limit of {featureAllocation} scans. Please upgrade to continue.
                            </span>
                        </div>
                    )}
                </div>

                {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-medium">Uploaded files:</h3>
                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                            {uploadedFiles.map((fileName, i) => (
                                <li key={i} className="flex items-center">
                                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                    {fileName}
                                </li>
                            ))}

                        </ul>
                    </div>
                )}
            </div>
        </DndContext >
    );
}

export default PDFDropzone