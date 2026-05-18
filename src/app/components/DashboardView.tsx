"use client";

import React from "react";
import { Layers, AlertTriangle, CheckCircle, Percent, Clock, Box, TrendingUp, BarChart2, Loader } from "lucide-react";
import type { ApiRecord, DashboardStats } from "../page";

interface DashboardViewProps {
  stats: DashboardStats | null;
  onOpenRecord: (record: ApiRecord) => void;
}

export default function DashboardView({ stats, onOpenRecord }: DashboardViewProps) {
  // If stats aren't loaded yet, render a sleek skeleton view
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 font-mono gap-3 min-h-[400px]">
        <Loader className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-xs">CALCULATING FACTORY ANALYTICS...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 font-sans text-zinc-300">
      
      {/* 1. Stat Summary Cards (Bento row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Processed */}
        <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-zinc-700/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <p className="text-xs text-zinc-400 font-mono">TOTAL PROCESSED LOGS</p>
            <p className="text-3xl font-bold text-white mt-1.5 font-mono">{stats.totalRecords}</p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Database persistent logs
            </span>
          </div>
          <div className="p-3 bg-cyan-950/20 text-cyan-400 rounded-xl border border-cyan-500/10">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Exception Rate */}
        <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-zinc-700/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <p className="text-xs text-zinc-400 font-mono">EXCEPTION RATE</p>
            <p className="text-3xl font-bold text-amber-500 mt-1.5 font-mono">{stats.exceptionRate}%</p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" /> Non-compliant parameters
            </span>
          </div>
          <div className="p-3 bg-amber-950/20 text-amber-500 rounded-xl border border-amber-500/10">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Pending Action items */}
        <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-zinc-700/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <p className="text-xs text-zinc-400 font-mono">PENDING REVIEWS</p>
            <p className="text-3xl font-bold text-red-400 mt-1.5 font-mono">{stats.exceptionCount}</p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-400" /> Blocking export streams
            </span>
          </div>
          <div className="p-3 bg-red-950/20 text-red-400 rounded-xl border border-red-500/10">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Average Confidence */}
        <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all hover:border-zinc-700/80">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div>
            <p className="text-xs text-zinc-400 font-mono">AVG OCR CONFIDENCE</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1.5 font-mono">{stats.avgConfidence}%</p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block flex items-center gap-1">
              <Percent className="w-3 h-3 text-emerald-400" /> Extracted OCR legibility
            </span>
          </div>
          <div className="p-3 bg-emerald-950/20 text-emerald-400 rounded-xl border border-emerald-500/10">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. Charts & Analytics Grid (Bento row 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Shift-wise Production Output Chart */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1.5 font-mono">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Shift-wise Quantities
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-mono">TOTAL UNITS PRODUCED PER SHIFT SEGMENT</p>
            
            <div className="space-y-6 my-4">
              {stats.shiftData.map((shift, i) => {
                const colors = [
                  { text: "text-cyan-400" },
                  { text: "text-purple-400" },
                  { text: "text-pink-400" }
                ];
                const activeColor = colors[i % colors.length];
                
                const maxQty = Math.max(...stats.shiftData.map(s => s.quantity), 100);
                const percent = Math.min(Math.max((shift.quantity / maxQty) * 100, 5), 100);

                return (
                  <div key={shift.shift} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-zinc-300">SHIFT {shift.shift} ({shift.count} log sheets)</span>
                      <span className={`font-semibold ${activeColor.text}`}>{shift.quantity} units</span>
                    </div>
                    <div className="w-full h-3.5 bg-zinc-950 rounded-full border border-zinc-850 overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percent}%`,
                          background: i === 0 
                            ? "linear-gradient(90deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.7) 100%)" 
                            : i === 1 
                            ? "linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.7) 100%)" 
                            : "linear-gradient(90deg, rgba(236,72,153,0.1) 0%, rgba(236,72,153,0.7) 100%)",
                          boxShadow: i === 0 
                            ? "0 0 10px rgba(6,182,212,0.3)" 
                            : i === 1 
                            ? "0 0 10px rgba(168,85,247,0.3)" 
                            : "0 0 10px rgba(236,72,153,0.3)"
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 font-mono leading-relaxed mt-4">
            Total overall production quantity: <strong className="text-zinc-300">{stats.totalQuantity} units</strong>.
          </div>
        </div>

        {/* Machine-wise Output Leaderboard */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1.5 font-mono">
              <Box className="w-4 h-4 text-purple-400" />
              Machine Production Share
            </h3>
            <p className="text-xs text-zinc-500 mb-4 font-mono">TOP ACTIVE MACHINES BY QUANTITY & TIME</p>
            
            <div className="space-y-4 my-2">
              {stats.machineData.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500 font-mono">No machine data available.</div>
              ) : (
                stats.machineData.map((mc) => {
                  const maxMcQty = Math.max(...stats.machineData.map(m => m.quantity), 100);
                  const barPercent = Math.min((mc.quantity / maxMcQty) * 100, 100);
                  return (
                    <div key={mc.machine} className="flex items-center gap-4">
                      <div className="w-16 text-xs text-zinc-400 font-mono font-semibold truncate">{mc.machine}</div>
                      <div className="flex-1 space-y-1">
                        <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-zinc-850 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500/20 to-purple-400 rounded-full shadow-[0_0_6px_rgba(168,85,247,0.2)] transition-all duration-700"
                            style={{ width: `${barPercent}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-24 text-right text-xs font-mono">
                        <span className="font-bold text-zinc-300">{mc.quantity} u</span>
                        <span className="text-[10px] text-zinc-500 ml-1">({mc.hours}h)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 font-mono leading-relaxed mt-4">
            Machine codes are evaluated dynamically. Highlighted values include operating durations.
          </div>
        </div>

        {/* Validation Errors & Distribution */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1.5 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Exception Distribution
            </h3>
            <p className="text-xs text-zinc-500 mb-5 font-mono">MOST FREQUENT VALIDATION FAILURES</p>

            <div className="space-y-4 my-2">
              {stats.errorBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500/20 mb-2" />
                  <p className="text-xs text-zinc-500 font-mono">ALL RULES COMPLYING</p>
                  <p className="text-[10px] text-zinc-650 font-mono mt-0.5">Zero exceptions detected currently.</p>
                </div>
              ) : (
                stats.errorBreakdown.map((err) => {
                  const maxErr = Math.max(...stats.errorBreakdown.map(e => e.count), 1);
                  const errPercent = (err.count / maxErr) * 100;
                  return (
                    <div key={err.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-300 truncate max-w-[200px]">{err.type}</span>
                        <span className="text-amber-500 font-bold">{err.count} issues</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-zinc-850 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500/30 to-amber-500 rounded-full"
                          style={{ width: `${errPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 font-mono leading-relaxed mt-4">
            Correct exceptions in the Records tab to clear errors and update the live dashboard metrics.
          </div>
        </div>

      </div>

      {/* 3. Action Center & Live Exception List (Bento row 3) */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2 font-mono">
              <TrendingUp className="w-4 h-4 text-red-400" />
              Exception Action Hub
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">CRITICAL EXTRACTED LOGS REQUIRING OPERATIONAL REVIEW</p>
          </div>
          <span className="text-xs bg-red-950/40 border border-red-500/20 text-red-400 px-3 py-1 rounded-full font-mono">
            {stats.exceptionCount} Critical Errors
          </span>
        </div>

        {stats.recentExceptions.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto opacity-40 mb-3" />
            <p className="text-sm font-bold text-white">System Fully Validated!</p>
            <p className="text-xs text-zinc-500 mt-1 font-mono">All operational logs are compliant and error-free.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentExceptions.map((record) => (
              <div 
                key={record.id}
                onClick={() => onOpenRecord(record)}
                className="bg-zinc-950/60 border border-zinc-850 hover:border-amber-500/30 hover:bg-zinc-900/30 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300 group-hover:text-cyan-400 truncate max-w-[200px] transition-colors font-mono">
                        {record.upload.fileName}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">Uploaded {new Date(record.upload.uploadedAt).toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] bg-red-950/50 text-red-400 border border-red-900/40 px-2 py-0.5 rounded font-mono">
                      {record.validationErrors.length} validation errors
                    </span>
                  </div>

                  <div className="bg-zinc-900/40 border border-zinc-850/60 p-2.5 rounded-lg text-[10.5px] font-mono text-amber-500 space-y-1">
                    {record.validationErrors.slice(0, 2).map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500/80">•</span>
                        <span>{err.errorMessage}</span>
                      </div>
                    ))}
                    {record.validationErrors.length > 2 && (
                      <div className="text-[9px] text-zinc-500 pl-3">
                        + {record.validationErrors.length - 2} more validation error(s)
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900/60 mt-3 pt-2 text-[10px] font-mono">
                  <span className="text-zinc-500">Employee: {record.employeeNum || "MISSING"}</span>
                  <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                    Open Review &gt;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
