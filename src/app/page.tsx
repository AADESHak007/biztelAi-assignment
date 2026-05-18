"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import UploadZone from "./components/UploadZone";
import DashboardView from "./components/DashboardView";
import RecordsView from "./components/RecordsView";
import ReviewModal from "./components/ReviewModal";
import SettingsView from "./components/SettingsView";

// ── Types matching API responses ────────────────────────────────────────────
export interface ApiRecord {
  id: string;
  uploadId: string;
  upload: {
    fileName: string;
    fileUrl: string;
    fileSize: string;
    mimeType: string;
    uploadedAt: string;
  };
  date: string;
  shift: string;
  employeeNum: string;
  opCode: string;
  machineNum: string;
  workOrderNum: string;
  quantity: number | null;
  timeTaken: number | null;
  confDate: number;
  confShift: number;
  confEmployeeNum: number;
  confOpCode: number;
  confMachineNum: number;
  confWorkOrderNum: number;
  confQuantity: number;
  confTimeTaken: number;
  status: "valid" | "exception" | "reviewed";
  manualNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  validationErrors: Array<{
    id: string;
    field: string;
    errorType: string;
    errorMessage: string;
  }>;
}

export interface DashboardStats {
  totalUploads: number;
  totalRecords: number;
  exceptionCount: number;
  validCount: number;
  reviewedCount: number;
  exceptionRate: number;
  avgConfidence: number;
  totalQuantity: number;
  shiftData: Array<{ shift: string; quantity: number; count: number }>;
  machineData: Array<{ machine: string; quantity: number; hours: number; count: number }>;
  errorBreakdown: Array<{ type: string; count: number }>;
  recentExceptions: ApiRecord[];
}

export default function Home() {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ApiRecord | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) return;
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch("/api/records?limit=50");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch (e) {
      console.error("Failed to fetch records:", e);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);
    fetchStats();
    fetchRecords();
  }, [fetchStats, fetchRecords]);

  // ── Refresh both stats and records after any mutation ─────────────────────
  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchRecords()]);
  }, [fetchStats, fetchRecords]);

  // ── After a new upload is processed, refresh + open review ───────────────
  const handleNewRecord = useCallback(async (newRecord: ApiRecord) => {
    await refreshAll();
    setSelectedRecord(newRecord);
    setIsReviewOpen(true);
  }, [refreshAll]);

  // ── After saving edits in the review panel ────────────────────────────────
  const handleRecordSaved = useCallback(async (updatedRecord: ApiRecord) => {
    // Optimistically update local list
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    setSelectedRecord(updatedRecord);
    // Then sync fresh data from DB
    await refreshAll();
  }, [refreshAll]);

  // ── After deleting a record ────────────────────────────────────────────────
  const handleRecordDeleted = useCallback(async (deletedId: string) => {
    // Optimistically filter local list
    setRecords((prev) => prev.filter((r) => r.id !== deletedId));
    await refreshAll();
  }, [refreshAll]);

  const handleOpenRecord = useCallback((record: ApiRecord) => {
    setSelectedRecord(record);
    setIsReviewOpen(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setIsReviewOpen(false);
    setSelectedRecord(null);
    refreshAll(); // refresh stats in case status changed
  }, [refreshAll]);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (!isMounted) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center font-sans text-zinc-400 min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">LOADING CONTROL DESK...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col font-sans select-none min-h-screen">

      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 py-4">

        {activeTab === "dashboard" && (
          <div className="space-y-2 animate-fade-in">
            <UploadZone
              onNewRecord={handleNewRecord}
              recentUploads={records.slice(0, 10)}
              onOpenRecord={handleOpenRecord}
            />
            <DashboardView
              stats={stats}
              onOpenRecord={handleOpenRecord}
            />
          </div>
        )}

        {activeTab === "records" && (
          <div className="animate-fade-in">
            <RecordsView
              records={records}
              isLoading={isLoadingRecords}
              onOpenRecord={handleOpenRecord}
              onOpenUploadTab={() => setActiveTab("dashboard")}
              onRefresh={refreshAll}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-fade-in">
            <SettingsView onRefreshStats={refreshAll} />
          </div>
        )}

      </main>

      <ReviewModal
        record={selectedRecord}
        allRecords={records}
        isOpen={isReviewOpen}
        onClose={handleCloseReview}
        onSave={handleRecordSaved}
        onDelete={handleRecordDeleted}
      />

      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-4 px-6 text-center text-[10px] text-zinc-600 font-mono">
        BIZTELAI AI OPERATIONS SUITE • FULL-STACK WITH NEON + CLOUDINARY + GEMINI • © 2026
      </footer>
    </div>
  );
}
