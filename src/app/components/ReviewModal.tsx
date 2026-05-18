"use client";

import React, { useState, useEffect } from "react";
import { X, Check, FileText, AlertTriangle, ShieldCheck, Save, Info, Loader, Trash2 } from "lucide-react";
import type { ApiRecord } from "../page";

interface ReviewModalProps {
  record: ApiRecord | null;
  allRecords: ApiRecord[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: ApiRecord) => void;
  onDelete: (deletedId: string) => void;
}

export default function ReviewModal({ record, allRecords, isOpen, onClose, onSave, onDelete }: ReviewModalProps) {
  // Form states
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("");
  const [employeeNum, setEmployeeNum] = useState("");
  const [opCode, setOpCode] = useState("");
  const [machineNum, setMachineNum] = useState("");
  const [workOrderNum, setWorkOrderNum] = useState("");
  const [quantity, setQuantity] = useState<number | string>("");
  const [timeTaken, setTimeTaken] = useState<number | string>("");
  const [manualNotes, setManualNotes] = useState("");

  // UI state
  const [liveErrors, setLiveErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  // Premium custom glassmorphic alert/confirm dialog state
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "confirm" | "alert";
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  // Filter sister records for the same upload
  const sisterRecords = React.useMemo(() => {
    if (!record) return [];
    return allRecords.filter((r) => r.uploadId === record.uploadId);
  }, [record, allRecords]);

  // Track the active row being edited
  const [activeRecordId, setActiveRecordId] = useState<string>("");

  useEffect(() => {
    if (record) {
      setActiveRecordId(record.id);
    }
  }, [record]);

  // Selected active record object
  const activeRecord = React.useMemo(() => {
    return sisterRecords.find((r) => r.id === activeRecordId) || record;
  }, [sisterRecords, activeRecordId, record]);

  // Handle batch progress and auto-advancing logic after saving
  useEffect(() => {
    if (!pendingAdvance || !activeRecordId) return;

    const timer = setTimeout(() => {
      setPendingAdvance(false);
      setSuccessSaved(false);

      // Find the next sister record in this batch that still has an active exception
      const nextException = sisterRecords.find(
        (r) => r.id !== activeRecordId && r.status === "exception"
      );

      if (nextException) {
        // Advance supervisor to correct the next exception row!
        setActiveRecordId(nextException.id);
      } else {
        // All entries are pristine! Auto-close modal with clean feedback
        onClose();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [sisterRecords, pendingAdvance, activeRecordId, onClose]);

  // Sync form states when active record changes
  useEffect(() => {
    if (activeRecord) {
      setDate(activeRecord.date ?? "");
      setShift(activeRecord.shift ?? "");
      setEmployeeNum(activeRecord.employeeNum ?? "");
      setOpCode(activeRecord.opCode ?? "");
      setMachineNum(activeRecord.machineNum ?? "");
      setWorkOrderNum(activeRecord.workOrderNum ?? "");
      setQuantity(activeRecord.quantity !== null ? activeRecord.quantity : "");
      setTimeTaken(activeRecord.timeTaken !== null ? activeRecord.timeTaken : "");
      setManualNotes(activeRecord.manualNotes ?? "");
      setSuccessSaved(false);
    }
  }, [activeRecord, isOpen]);

  const handleDeleteRecord = async () => {
    if (!activeRecord) return;
    
    setCustomDialog({
      isOpen: true,
      title: "Delete Digitized Record",
      message: "Are you sure you want to permanently delete this digitized operational record? This action cannot be undone.",
      type: "confirm",
      confirmText: "Delete Record",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          const res = await fetch(`/api/records/${activeRecord.id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error("Failed to delete record.");
          }

          onDelete(activeRecord.id);
          
          // Auto-select another sister record if one exists, otherwise modal closes
          const remainingSiblings = sisterRecords.filter((r) => r.id !== activeRecord.id);
          if (remainingSiblings.length > 0) {
            setActiveRecordId(remainingSiblings[0].id);
          } else {
            onClose();
          }
        } catch (err) {
          console.error("[handleDeleteRecord]", err);
          setCustomDialog({
            isOpen: true,
            title: "Deletion Failed",
            message: err instanceof Error ? err.message : "An unexpected error occurred while deleting the record.",
            type: "alert",
            confirmText: "Dismiss"
          });
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  // snappy local validation helper
  useEffect(() => {
    if (!activeRecord) return;

    const errors: string[] = [];

    // Mandatory
    if (!date.trim()) errors.push("Date is a mandatory field.");
    if (!shift.trim()) errors.push("Shift is a mandatory field.");
    if (!employeeNum.trim()) errors.push("Operator ID is a mandatory field.");
    if (!machineNum.trim()) errors.push("Machine Number is a mandatory field.");
    if (!workOrderNum.trim()) errors.push("Work Order Number is a mandatory field.");

    // Format matches
    const shiftTrimmed = shift.trim();
    if (shift.trim() && !["1", "2", "3"].includes(shiftTrimmed)) {
      errors.push(`Invalid shift code '${shift}'. Must be 1, 2, or 3.`);
    }

    const machineUpper = machineNum.trim().toUpperCase();
    if (machineNum.trim() && !machineUpper.startsWith("MC")) {
      errors.push(`Machine number '${machineNum}' must start with 'MC'.`);
    }

    // Number conversions
    const qtyVal = Number(quantity);
    if (quantity === "" || isNaN(qtyVal)) {
      errors.push("Quantity Produced must be a valid number.");
    } else if (qtyVal <= 0) {
      errors.push("Quantity Produced must be greater than zero.");
    } else if (qtyVal > 1000) {
      errors.push(`Warning: Quantity ${qtyVal} exceeds shift threshold of 1000.`);
    }

    const hrsVal = Number(timeTaken);
    if (timeTaken === "" || isNaN(hrsVal)) {
      errors.push("Time Taken must be a valid number.");
    } else if (hrsVal <= 0) {
      errors.push("Time Taken must be greater than zero.");
    } else if (hrsVal > 12) {
      errors.push(`Warning: Time Taken ${hrsVal} hrs exceeds shift limit of 12.`);
    }

    setLiveErrors(errors);
  }, [date, shift, employeeNum, opCode, machineNum, workOrderNum, quantity, timeTaken, activeRecord]);

  if (!isOpen || !record || !activeRecord) return null;

  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/records/${activeRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          shift,
          employeeNum,
          opCode,
          machineNum,
          workOrderNum,
          quantity:  quantity === "" ? "" : Number(quantity),
          timeTaken: timeTaken === "" ? "" : Number(timeTaken),
          manualNotes: manualNotes.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save record.");
      }

      const updatedRecord: ApiRecord = await res.json();
      onSave(updatedRecord);
      setSuccessSaved(true);
      setPendingAdvance(true);

    } catch (err) {
      console.error(err);
      setCustomDialog({
        isOpen: true,
        title: "Save Failed",
        message: err instanceof Error ? err.message : "Error saving corrections.",
        type: "alert",
        confirmText: "Dismiss"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getConfDetails = (conf: number) => {
    const pct = Math.round((conf ?? 0) * 100);
    if (conf >= 0.8) return { label: "HIGH", color: "text-emerald-400 border-emerald-950/40 bg-emerald-950/20", pct };
    if (conf >= 0.6) return { label: "MEDIUM", color: "text-amber-500 border-amber-950/40 bg-amber-950/20", pct };
    return { label: "LOW", color: "text-red-400 border-red-950/40 bg-red-950/20 animate-pulse", pct };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end font-sans">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>

      <div className="relative w-full max-w-5xl h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col md:flex-row transition-transform duration-300 overflow-hidden">
        
        {/* Left Side: Document blueprint view */}
        <div className="flex-1 bg-zinc-950/40 border-r border-zinc-850 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white font-mono">DIGITAL SOURCE SCAN</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">ID: {activeRecord.id.slice(0, 8)}</span>
            </div>

            <div className="relative w-full aspect-[3/4] bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col justify-between p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 shadow-[0_0_12px_#06b6d4] animate-scanline pointer-events-none"></div>

              <div className="border border-cyan-500/20 bg-cyan-950/5 p-4 rounded-xl relative overflow-hidden flex flex-col gap-1.5">
                <p className="text-xs font-bold text-white font-mono">{activeRecord.upload.fileName}</p>
                <div className="flex items-center gap-4 text-[9.5px] font-mono text-zinc-500">
                  <span>MIME: {activeRecord.upload.mimeType}</span>
                  <span>SIZE: {activeRecord.upload.fileSize}</span>
                </div>
              </div>

              {/* Show original image in a beautiful frame */}
              <div className="flex-1 my-6 border border-zinc-800/40 rounded-xl bg-zinc-950/40 relative overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={activeRecord.upload.fileUrl} 
                  alt="original source" 
                  className="max-w-full max-h-full object-contain rounded-lg opacity-85 hover:opacity-100 transition-opacity" 
                />
              </div>

              <div className="p-3 border border-zinc-850 rounded-xl text-[10px] font-mono text-zinc-500 bg-zinc-950/30 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                <span>Extracted via Gemini Multimodal OCR. Review file details left, correct output right.</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-650 mt-6 leading-relaxed">
            SYSTEM ID: {activeRecord.id.toUpperCase()} • UPLOAD TIMESTAMP: {new Date(activeRecord.upload.uploadedAt).toLocaleString()}
          </div>
        </div>        {/* Right Side: Data Editor */}
        <div className="w-full md:w-[500px] bg-zinc-900/30 p-4 md:p-5 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 border-zinc-800">
          <form onSubmit={handleVerifyAndSave} className="space-y-4 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
                <div>
                  <h3 className="font-bold text-xs text-white font-mono">RECORD REVIEW EDITOR</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">CORRECT EXTRACTED VALUES AND AUDIT RULES</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Batch Row Selector Tab Panel */}
              {sisterRecords.length > 1 && (
                <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-2 mb-3">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold mb-1.5 tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                    EXTRACTED BATCH LOG ENTRIES ({sisterRecords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sisterRecords.map((r, idx) => {
                      const isSelected = r.id === activeRecordId;
                      const hasError = r.status === "exception";
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setActiveRecordId(r.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10.5px] font-mono transition-all ${
                            isSelected
                              ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                              : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          <span>Row {idx + 1}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasError ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`}></span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Date</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confDate).color}`}>
                        {getConfDetails(activeRecord.confDate).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Shift</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confShift).color}`}>
                        {getConfDetails(activeRecord.confShift).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      placeholder="1, 2, or 3"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Operator ID</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confEmployeeNum).color}`}>
                        {getConfDetails(activeRecord.confEmployeeNum).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={employeeNum}
                      onChange={(e) => setEmployeeNum(e.target.value)}
                      placeholder="EMP-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Operation Code</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confOpCode).color}`}>
                        {getConfDetails(activeRecord.confOpCode).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={opCode}
                      onChange={(e) => setOpCode(e.target.value)}
                      placeholder="OP-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Machine Number</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confMachineNum).color}`}>
                        {getConfDetails(activeRecord.confMachineNum).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={machineNum}
                      onChange={(e) => setMachineNum(e.target.value)}
                      placeholder="MC-XXXX"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Work Order Number</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confWorkOrderNum).color}`}>
                        {getConfDetails(activeRecord.confWorkOrderNum).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={workOrderNum}
                      onChange={(e) => setWorkOrderNum(e.target.value)}
                      placeholder="WO-XXXXX"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Quantity Produced</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confQuantity).color}`}>
                        {getConfDetails(activeRecord.confQuantity).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Units"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-zinc-400 font-bold uppercase">Time Taken (Hours)</label>
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded border ${getConfDetails(activeRecord.confTimeTaken).color}`}>
                        {getConfDetails(activeRecord.confTimeTaken).pct}%
                      </span>
                    </div>
                    <input
                      type="text"
                      value={timeTaken}
                      onChange={(e) => setTimeTaken(e.target.value)}
                      placeholder="Hours"
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[9px] font-mono text-zinc-550 font-bold uppercase">Supervisor Override Audit Notes</label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Provide override justifications for validation discrepancies..."
                    className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/40 rounded-lg p-2 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none resize-none font-mono"
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${liveErrors.length > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500"}`} />
                  <span className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase">Live Rules Validation Engine</span>
                </div>

                {liveErrors.length === 0 ? (
                  <div className="p-2 bg-emerald-950/20 border border-emerald-950 text-emerald-400 text-[10px] rounded-lg font-mono flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Compliant: All business rules met successfully.</span>
                  </div>
                ) : (
                  <div className="bg-amber-950/15 border border-amber-950/60 p-2.5 rounded-lg text-[9.5px] font-mono text-amber-500 space-y-1 max-h-[85px] overflow-y-auto">
                    {liveErrors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 leading-snug">
                        <span>•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-850 flex items-center justify-between gap-2.5 bg-zinc-900/10 mt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteRecord}
                  disabled={isDeleting}
                  className="px-3 py-1.5 border border-rose-950/40 hover:border-rose-900 bg-rose-950/10 hover:bg-rose-950/30 text-rose-450 rounded-lg text-[11px] font-semibold font-mono transition-colors flex items-center gap-1.5"
                >
                  {isDeleting ? <Loader className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  DELETE
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-zinc-800 hover:bg-zinc-800/40 text-zinc-400 hover:text-white rounded-lg text-[11px] font-semibold font-mono transition-colors"
                >
                  CANCEL
                </button>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                  successSaved
                    ? "bg-emerald-600 text-zinc-950"
                    : liveErrors.length > 0
                    ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-900/10"
                    : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-md shadow-cyan-900/10"
                }`}
              >
                {isSaving ? (
                  <Loader className="w-4 h-4 animate-spin text-zinc-950" />
                ) : successSaved ? (
                  <>
                    <Check className="w-4 h-4" /> VERIFIED & SAVED
                  </>
                ) : liveErrors.length > 0 ? (
                  <>
                    <Save className="w-4 h-4" /> OVERRIDE & COMPLY
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> VERIFY & SAVE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Custom Glassmorphic Alert/Confirm Dialog Modal */}
      {customDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/70 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl backdrop-blur-2xl relative overflow-hidden text-center">
            {/* Top gradient highlight banner */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${customDialog.type === "confirm" ? "from-rose-500 via-amber-500 to-rose-500" : "from-red-500 via-zinc-800 to-red-500"}`}></div>
            
            {/* Context Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center mb-4">
              {customDialog.type === "confirm" ? (
                <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
              ) : (
                <X className="w-6 h-6 text-red-500" />
              )}
            </div>

            <h3 className="text-sm font-bold text-white mb-2 font-mono">
              {customDialog.title}
            </h3>
            
            <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed">
              {customDialog.message}
            </p>

            <div className="flex items-center justify-center gap-3">
              {customDialog.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold font-mono border border-zinc-700 transition-colors cursor-pointer"
                >
                  {customDialog.cancelText || "Cancel"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCustomDialog(prev => ({ ...prev, isOpen: false }));
                  if (customDialog.onConfirm) {
                    customDialog.onConfirm();
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer shadow-md ${
                  customDialog.type === "confirm" 
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20" 
                    : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-zinc-950/20"
                }`}
              >
                {customDialog.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
