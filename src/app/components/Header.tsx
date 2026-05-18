"use client";

import React, { useState } from "react";
import { Cpu, CheckCircle, AlertTriangle, Layers, Settings, Menu, X } from "lucide-react";
import type { DashboardStats } from "../page";

interface HeaderProps {
  stats: DashboardStats | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ stats, activeTab, setActiveTab }: HeaderProps) {
  const totalUploads = stats?.totalUploads ?? 0;
  const exceptions = stats?.exceptionCount ?? 0;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Calculate success rate: (valid + reviewed) / total records
  const totalRecords = stats?.totalRecords ?? 0;
  const compliant = (stats?.validCount ?? 0) + (stats?.reviewedCount ?? 0);
  const successRate = totalRecords > 0 
    ? Math.round((compliant / totalRecords) * 100) 
    : 100;

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative">
        
        {/* Brand Logo & Mobile Navigation row */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-sm animate-pulse"></div>
              <div className="relative bg-zinc-900 border border-cyan-500/30 p-2.5 rounded-lg text-cyan-400">
                <Cpu className="w-6 h-6 animate-spin-slow" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                BIZTEL<span className="text-cyan-400 font-extrabold">AI</span>
              </h1>
              <p className="text-xs text-zinc-400 font-mono">OPERATIONAL WORKFLOW DIGITIZATION PLATFORM</p>
            </div>
          </div>

          {/* Hamburger button on small screens */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="flex md:hidden p-2 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg bg-zinc-900 hover:bg-zinc-850 transition-all focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Global Live Statistics */}
        <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center">
          <div className="bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-lg text-center md:text-left">
            <p className="text-[10px] text-zinc-500 font-mono">TOTAL UPLOADS</p>
            <p className="text-lg font-semibold text-white font-mono">{totalUploads}</p>
          </div>
          
          <div className="bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-lg text-center md:text-left">
            <p className="text-[10px] text-zinc-500 font-mono flex items-center justify-center md:justify-start gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> EXCEPTIONS
            </p>
            <p className="text-lg font-semibold text-amber-500 font-mono">{exceptions}</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 px-3.5 py-1.5 rounded-lg text-center md:text-left">
            <p className="text-[10px] text-zinc-500 font-mono">SUCCESS RATE</p>
            <p className={`text-lg font-semibold font-mono ${successRate > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {successRate}%
            </p>
          </div>
        </div>

        {/* Navigation - Desktop Row */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex bg-zinc-900/80 border border-zinc-850 p-1 rounded-lg">
            <button
              onClick={() => handleTabSelect("dashboard")}
              className={`px-3 py-1 rounded text-xs font-medium font-mono transition-all ${
                activeTab === "dashboard"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              DASHBOARD
            </button>
            <button
              onClick={() => handleTabSelect("records")}
              className={`px-3 py-1 rounded text-xs font-medium font-mono transition-all ${
                activeTab === "records"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              RECORDS
            </button>
            <button
              onClick={() => handleTabSelect("settings")}
              className={`px-2 py-1 rounded transition-all flex items-center ${
                activeTab === "settings"
                  ? "bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Configuration Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-zinc-950/95 border-b border-zinc-800 p-4 space-y-2 shadow-2xl flex flex-col md:hidden z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <button
              onClick={() => handleTabSelect("dashboard")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center justify-between ${
                activeTab === "dashboard"
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold"
                  : "text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-850"
              }`}
            >
              <span>DASHBOARD</span>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "dashboard" ? "bg-cyan-400" : "bg-transparent"}`}></span>
            </button>
            
            <button
              onClick={() => handleTabSelect("records")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center justify-between ${
                activeTab === "records"
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold"
                  : "text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-850"
              }`}
            >
              <span>RECORDS HISTORY</span>
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "records" ? "bg-cyan-400" : "bg-transparent"}`}></span>
            </button>

            <button
              onClick={() => handleTabSelect("settings")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium font-mono transition-all flex items-center justify-between ${
                activeTab === "settings"
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold"
                  : "text-zinc-400 hover:text-white bg-zinc-900/40 border border-zinc-850"
              }`}
            >
              <span>SYSTEM SETTINGS</span>
              <Settings className={`w-4 h-4 ${activeTab === "settings" ? "text-cyan-400" : "text-zinc-500"}`} />
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
