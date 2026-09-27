import React from 'react';
import { Cpu, Cloud, History, Sparkles, Activity } from 'lucide-react';

export default function Header({ health, onOpenHistory, historyCount }) {
  const isAiActive = health?.integrations?.geminiAi?.configured;
  const isS3Active = health?.integrations?.cloudStorage?.provider === 'aws_s3';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                StackFix <span className="text-indigo-400 font-normal">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold px-2 py-0.5 rounded-full">
                SaaS v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Cloud-Native AI Debugging & Root Cause Analysis Platform
            </p>
          </div>
        </div>

        {/* Integration Status Badges & History */}
        <div className="flex items-center space-x-3">
          
          {/* AI Engine Status */}
          <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isAiActive 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Cpu className="h-3.5 w-3.5" />
            <span>{isAiActive ? 'Gemini 1.5 Flash' : 'Heuristic AI Fallback'}</span>
          </div>

          {/* Cloud S3 Status */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-900/80 border-slate-800 text-slate-300">
            <Cloud className="h-3.5 w-3.5 text-indigo-400" />
            <span>{isS3Active ? 'AWS S3 Enabled' : 'Cloud Abstraction Storage'}</span>
          </div>

          {/* System Uptime Badge */}
          {health && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-900 border border-slate-800 text-slate-400">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>UP: {health.uptime?.formatted}</span>
            </div>
          )}

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all"
          >
            <History className="h-4 w-4" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}
