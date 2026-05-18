"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet, Loader, ShieldAlert } from "lucide-react";
import type { ApiRecord } from "../page";

interface UploadZoneProps {
  onNewRecord: (record: ApiRecord) => void;
  recentUploads: ApiRecord[];
  onOpenRecord: (record: ApiRecord) => void;
}

type ProcessingStep = "idle" | "uploading" | "extracting" | "validating" | "success" | "error";

export default function UploadZone({ onNewRecord, recentUploads, onOpenRecord }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [stepText, setStepText] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processedRecord, setProcessedRecord] = useState<ApiRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const processFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview("pdf");
    }

    try {
      // Step 1: Upload
      setStep("uploading");
      setStepText("Uploading document to Cloudinary secure storage...");

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Upload failed");
      }

      const uploadResult = await uploadRes.json();
      const uploadId = uploadResult.uploadId;

      // Step 2: Extraction
      setStep("extracting");
      setStepText("Calling multimodal OCR API...");

      const extractRes = await fetch("/api/records/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });

      if (!extractRes.ok) {
        const err = await extractRes.json();
        throw new Error(err.error ?? "Gemini extraction failed");
      }

      // Step 3: Validating
      setStep("validating");
      setStepText("Running server-side validations & duplicate checks...");
      await new Promise((r) => setTimeout(r, 600));

      const record: ApiRecord = await extractRes.json();
      setProcessedRecord(record);
      setStep("success");
      setStepText(
        record.status === "exception"
          ? "Parsed with validation exceptions — review required!"
          : "Document digitized successfully!"
      );

      onNewRecord(record);

    } catch (err) {
      console.error("[processFile]", err);
      setStep("error");
      setErrorMsg(err instanceof Error ? err.message : "Digitization failed.");
    }
  };

  const handleReset = () => {
    setStep("idle");
    setStepText("");
    setFilePreview(null);
    setProcessedRecord(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusColors = {
    valid:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    exception: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    reviewed:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 font-sans text-zinc-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Upload Zone (left 2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-white mb-1.5 font-mono">DIGITIZATION CAPTURE</h3>
            <p className="text-xs text-zinc-500 mb-4">DRAG AND DROP OPERATIONAL LOG SHEETS TO DIGITIZE</p>

            {step === "idle" && (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl py-12 px-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-cyan-500 bg-cyan-950/10 text-cyan-400"
                    : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 text-cyan-400">
                  <Upload className="w-8 h-8 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-zinc-300 text-center">
                  Drag and drop operational sheet, or{" "}
                  <span className="text-cyan-400 hover:underline">browse</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-mono text-center">
                  SUPPORTS PDF, PNG, JPG, JPEG (UP TO 10MB)
                </p>
              </div>
            )}

            {step !== "idle" && (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[220px]">
                {filePreview && filePreview !== "pdf" && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-zinc-800 mb-4 bg-zinc-900">
                    <img src={filePreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {filePreview === "pdf" && (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-rose-400 mb-4">
                    <FileText className="w-12 h-12" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-2 mt-2">
                  {step !== "success" && step !== "error" ? (
                    <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : step === "success" ? (
                    processedRecord?.status === "exception"
                      ? <ShieldAlert className="w-6 h-6 text-amber-500" />
                      : <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}

                  <span className={`text-sm font-bold ${
                    step === "success"
                      ? processedRecord?.status === "exception" ? "text-amber-500" : "text-emerald-400"
                      : step === "error" ? "text-red-400"
                      : "text-zinc-200"
                  }`}>
                    {step === "uploading"  && "UPLOADING THE IMAGE"}
                    {step === "extracting" && "OCR ANALYZING"}
                    {step === "validating" && "ENFORCING BUSINESS RULES"}
                    {step === "success"    && (processedRecord?.status === "exception" ? "VALIDATION EXCEPTION TRIGGERED" : "DIGITIZATION COMPLETE")}
                    {step === "error"      && "EXTRACTION FAILED"}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 font-mono mt-1 text-center max-w-sm">
                  {step === "error" ? errorMsg : stepText}
                </p>

                {step === "success" && processedRecord && (
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 rounded-lg text-xs font-semibold font-mono transition-colors"
                    >
                      UPLOAD ANOTHER
                    </button>
                    <button
                      onClick={() => onOpenRecord(processedRecord)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors ${
                        processedRecord.status === "exception"
                          ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                          : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
                      }`}
                    >
                      OPEN RECORD REVIEW &gt;
                    </button>
                  </div>
                )}

                {step === "error" && (
                  <button
                    onClick={handleReset}
                    className="px-5 py-2 mt-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-xs font-semibold font-mono transition-colors"
                  >
                    TRY AGAIN
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-400 mb-2 font-mono">PIPELINE ARCHITECTURE</h4>
            <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-zinc-500">
              {[
                { label: "STEP 1", value: "IMAGE UPLOAD", color: "text-cyan-400" },
                { label: "STEP 2", value: "OCR ANALYZING", color: "text-purple-400" },
                { label: "STEP 3", value: "DB + VALIDATION", color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <p className="text-zinc-600">{s.label}</p>
                  <p className={`${s.color} font-bold mt-0.5`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload History Queue (right col) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[300px]">
          <h3 className="font-bold text-sm text-white mb-1.5 font-mono">UPLOADS QUEUE</h3>
          <p className="text-xs text-zinc-500 mb-4">RECENT INGESTION HISTORY</p>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 flex-1">
            {recentUploads.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-650 font-mono">
                Queue empty. No files processed.
              </div>
            ) : (
              recentUploads.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onOpenRecord(rec)}
                  className="p-3 bg-zinc-950 hover:bg-zinc-900/60 border border-zinc-805 hover:border-zinc-700/80 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <div className={`p-2 rounded-lg ${rec.status === "exception" ? "bg-amber-950/30 text-amber-500" : "bg-zinc-900 text-cyan-400"}`}>
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-cyan-400 truncate transition-colors">
                      {rec.upload.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[9.5px] font-mono text-zinc-500">
                      <span>{rec.upload.fileSize}</span>
                      <span>•</span>
                      <span>{new Date(rec.upload.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${statusColors[rec.status]}`}>
                    {rec.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-zinc-800/60 pt-3 text-[10px] text-zinc-500 font-mono leading-relaxed mt-4">
            Records persisted to Neon PostgreSQL database.
          </div>
        </div>

      </div>
    </div>
  );
}
