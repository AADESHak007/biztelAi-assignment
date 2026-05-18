"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, AlertTriangle, CheckCircle, FileSpreadsheet, Edit3, ArrowUpDown, PlayCircle, Download, RefreshCw, Loader } from "lucide-react";
import type { ApiRecord } from "../page";

interface RecordsViewProps {
  records: ApiRecord[];
  isLoading: boolean;
  onOpenRecord: (record: ApiRecord) => void;
  onOpenUploadTab: () => void;
  onRefresh: () => Promise<void>;
}

export default function RecordsView({ records, isLoading, onOpenRecord, onOpenUploadTab, onRefresh }: RecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── CSV Export handler ────────────────────────────────────────────────────
  const handleExportCSV = () => {
    let url = "/api/records/export?";
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (shiftFilter !== "all")   params.append("shift", shiftFilter);
    window.open(url + params.toString(), "_blank");
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Filter and Search logic in memory for smooth typing
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        // Search query check
        const query = searchTerm.toLowerCase().trim();
        if (query !== "") {
          const matchFileName = rec.upload.fileName.toLowerCase().includes(query);
          const matchEmployee = String(rec.employeeNum).toLowerCase().includes(query);
          const matchWO = String(rec.workOrderNum).toLowerCase().includes(query);
          const matchMC = String(rec.machineNum).toLowerCase().includes(query);
          const matchOp = String(rec.opCode).toLowerCase().includes(query);
          if (!matchFileName && !matchEmployee && !matchWO && !matchMC && !matchOp) return false;
        }

        // Status check
        if (statusFilter !== "all" && rec.status !== statusFilter) return false;

        // Shift check
        if (shiftFilter !== "all" && String(rec.shift).toUpperCase() !== shiftFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // Sort logic
        let valA: any = a[sortField as keyof ApiRecord] || "";
        let valB: any = b[sortField as keyof ApiRecord] || "";

        if (sortField === "fileName") {
          valA = a.upload.fileName;
          valB = b.upload.fileName;
        }

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [records, searchTerm, statusFilter, shiftFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const statusColors = {
    valid:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]",
    exception: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]",
    reviewed:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.05)]",
  };

  const getMinConfidence = (rec: ApiRecord) => {
    const scores = [
      rec.confDate,
      rec.confShift,
      rec.confEmployeeNum,
      rec.confOpCode,
      rec.confMachineNum,
      rec.confWorkOrderNum,
      rec.confQuantity,
      rec.confTimeTaken,
    ].filter((s) => s != null);
    if (scores.length === 0) return 0;
    return Math.round(Math.min(...scores) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 font-sans text-zinc-300 space-y-6">
      
      {/* Search and Filters Bento Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              OPERATIONAL LOG RECORDS DATABASE
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">SEARCH, SORT, AND FILTER DIGITIZED MANUFACTURING RECORDS</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex items-center justify-center p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-all"
              title="Refresh Database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg text-xs font-bold font-mono transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" /> EXPORT CSV
            </button>

            <button
              onClick={onOpenUploadTab}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 rounded-lg text-xs font-bold font-mono transition-all shadow-sm"
            >
              <PlayCircle className="w-4 h-4" /> DIGITIZE NEW DOCUMENT
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Text Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search WO, Emp, Machine, Op..."
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-cyan-500/50 rounded-lg py-2 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">STATUS</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-cyan-500/40 rounded-lg py-2 px-3 text-xs text-zinc-300 focus:outline-none font-mono"
            >
              <option value="all">All Compliance Statuses</option>
              <option value="valid">Compliant (Valid)</option>
              <option value="exception">Validation Exceptions</option>
              <option value="reviewed">Manually Reviewed</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">SHIFT</span>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-cyan-500/40 rounded-lg py-2 px-3 text-xs text-zinc-300 focus:outline-none font-mono"
            >
              <option value="all">All Shifts</option>
              <option value="A">Shift A</option>
              <option value="B">Shift B</option>
              <option value="C">Shift C</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-zinc-500 font-mono gap-1">
            <Filter className="w-3.5 h-3.5" />
            Showing {filteredRecords.length} of {records.length} records
          </div>

        </div>

      </div>

      {/* Main Database Table Card */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 font-mono gap-2">
              <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
              <span>SYNCING DATA RECORD PIPELINES...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/40 text-[10.5px] font-mono text-zinc-500 tracking-wider">
                  <th 
                    onClick={() => handleSort("fileName")}
                    className="py-3 px-4 font-semibold hover:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      DOCUMENT FILE <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("date")}
                    className="py-3 px-3 font-semibold hover:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      DATE <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-semibold">SHIFT</th>
                  <th className="py-3 px-3 font-semibold">OPERATOR</th>
                  <th className="py-3 px-3 font-semibold">MACHINE</th>
                  <th className="py-3 px-3 font-semibold">WORK ORDER</th>
                  <th className="py-3 px-3 font-semibold text-right">QUANTITY</th>
                  <th className="py-3 px-3 font-semibold text-center">CONFIDENCE</th>
                  <th 
                    onClick={() => handleSort("status")}
                    className="py-3 px-4 font-semibold hover:text-white cursor-pointer select-none text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      COMPLIANCE <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/45 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-zinc-500 font-mono">
                      No matching records found in database log history.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const minConf = getMinConfidence(rec);
                    const confColor = 
                      minConf > 80 
                        ? "text-emerald-400 bg-emerald-950/10 border-emerald-900/30" 
                        : minConf > 60 
                        ? "text-amber-500 bg-amber-950/10 border-amber-900/30" 
                        : "text-red-400 bg-red-950/10 border-red-900/30 animate-pulse";

                    return (
                      <tr 
                        key={rec.id}
                        className="hover:bg-zinc-900/30 group transition-colors font-mono"
                      >
                        <td className="py-3 px-4 max-w-[180px]">
                          <p className="font-bold text-zinc-300 truncate group-hover:text-cyan-400 transition-colors">
                            {rec.upload.fileName}
                          </p>
                          <p className="text-[9.5px] text-zinc-500 mt-0.5">{rec.upload.fileSize}</p>
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {rec.date || <span className="text-red-400/80 font-bold">MISSING</span>}
                        </td>
                        <td className="py-3 px-3 font-bold text-zinc-300">
                          {rec.shift || <span className="text-red-400/80 font-bold">MISSING</span>}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 truncate max-w-[100px]">
                          {rec.employeeNum || <span className="text-red-400/80 font-bold">MISSING</span>}
                        </td>
                        <td className="py-3 px-3 font-bold text-zinc-300">
                          {rec.machineNum || <span className="text-red-400/80 font-bold">MISSING</span>}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 truncate max-w-[100px]">
                          {rec.workOrderNum || <span className="text-red-400/80 font-bold">MISSING</span>}
                        </td>
                        <td className="py-3 px-3 font-bold text-right text-zinc-200">
                          {rec.quantity !== null 
                            ? Number(rec.quantity).toLocaleString() 
                            : <span className="text-red-400 font-bold">EMPTY</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${confColor}`}>
                            {minConf}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[rec.status]}`}>
                            {rec.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => onOpenRecord(rec)}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 rounded-lg transition-colors border border-transparent hover:border-zinc-700"
                            title="Review Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
