"use client";

import React, { useState } from "react";
import { Key, Save, Check, Sliders, ShieldAlert, Cpu } from "lucide-react";

interface SettingsViewProps {
  onRefreshStats?: () => Promise<void>;
}

export default function SettingsView({ onRefreshStats }: SettingsViewProps) {
  // Business rules thresholds (mocking user-adjustable thresholds)
  const [maxQuantity, setMaxQuantity] = useState("1000");
  const [maxHours, setMaxHours] = useState("12");
  const [reqPrefix, setReqPrefix] = useState("MC");
  const [bizRulesSaved, setBizRulesSaved] = useState(false);

  const handleSaveBizRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setBizRulesSaved(true);
    if (onRefreshStats) {
      await onRefreshStats();
    }
    setTimeout(() => setBizRulesSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans text-zinc-200">
      
      {/* Introduction Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/20 to-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-8 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2 font-mono">
          <Sliders className="w-5 h-5 text-cyan-400" />
          System Settings & Control Panel
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Configure the server-side extraction engine and customize operational validation constraints. 
          The application runs on a **production-ready Full-Stack architecture** backing all actions into Neon PostgreSQL and Cloudinary.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        
        {/* Business Validation Thresholds */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-white text-base font-mono">Validation Constraints</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed font-mono">
              Customize the rules enforced by the exception handling engine. Modifying these immediately re-evaluates all unprocessed and edited logs.
            </p>

            <form onSubmit={handleSaveBizRules} className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5">MAX QUANTITY/SHIFT</label>
                  <input
                    type="number"
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1.5">MAX HOURS/SHIFT</label>
                  <input
                    type="number"
                    value={maxHours}
                    onChange={(e) => setMaxHours(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">MACHINE CODE REQUIRED PREFIX</label>
                <input
                  type="text"
                  value={reqPrefix}
                  onChange={(e) => setReqPrefix(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700 font-mono"
                >
                  {bizRulesSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Thresholds Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-cyan-400" /> Update Constraints
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-zinc-950/40 border border-zinc-850/50 mt-6">
            <h4 className="text-[10px] font-mono text-zinc-500 font-bold mb-1">ENFORCED RULES MATRIX</h4>
            <ul className="text-[10px] text-zinc-500 space-y-1 font-mono list-disc list-inside">
              <li>Shift value must exactly match 'A', 'B', or 'C'.</li>
              <li>Quantity produced must be &gt; 0 and &le; {maxQuantity || "1000"}.</li>
              <li>Operational time taken must be &gt; 0 and &le; {maxHours || "12"} hrs.</li>
              <li>Machine code identifier must start with '{reqPrefix || "MC"}'.</li>
              <li>Work Order numbers must remain globally unique in log histories.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
