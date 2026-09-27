import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Copy, Download, Sparkles, Clock, ShieldCheck, FileCode, ArrowRight } from 'lucide-react';

export default function AnalysisResult({ result }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('fixed'); // 'fixed' | 'original'

  if (!result || !result.data) return null;

  const { analysis, metadata, id, input } = result.data;
  const { rootCause, explanation, fixSteps, fixedCode } = analysis;
  const confidencePercent = Math.round((analysis.confidenceScore || 0.9) * 100);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fixedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([fixedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixed_code_${id.slice(0, 6)}.${input.language === 'python' ? 'py' : input.language === 'java' ? 'java' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 border border-indigo-500/30 space-y-6 animate-fade-in shadow-2xl">
      
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Diagnostic Fix & Analysis Report</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">ID: {id}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-2">
          
          <span className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            <span>{confidencePercent}% Confidence</span>
          </span>

          <span className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{metadata?.executionTimeMs || 45}ms</span>
          </span>

          <span className="text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
            {metadata?.mode || 'gemini_ai'}
          </span>

        </div>
      </div>

      {/* Root Cause Card */}
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 space-y-1.5">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Root Cause</span>
        </div>
        <p className="text-xs text-rose-200/90 leading-relaxed font-mono">
          {rootCause}
        </p>
      </div>

      {/* Explanation & Fix Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Issue Explanation */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Issue Explanation
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Step-by-Step Fix Action Plan */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Action Plan
          </h4>
          <ul className="space-y-1.5">
            {fixSteps && fixSteps.map((step, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Code Viewer Section (Fixed Code vs Original Code) */}
      <div className="space-y-3">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('fixed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'fixed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Corrected Code</span>
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'original'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Original Input</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto leading-relaxed text-slate-200">
          <pre>
            <code>{activeTab === 'fixed' ? fixedCode : input.code}</code>
          </pre>
        </div>

      </div>

    </div>
  );
}
