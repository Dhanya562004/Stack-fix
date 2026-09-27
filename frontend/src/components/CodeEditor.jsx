import React from 'react';
import { Code2, AlertTriangle, Play, RefreshCw, Zap } from 'lucide-react';

const PRESETS = [
  {
    name: 'Python NameError',
    language: 'python',
    code: `name = "Alex"\nprint("Hello " + username)`,
    error: `NameError: name 'username' is not defined on line 2`
  },
  {
    name: 'JS ReferenceError',
    language: 'javascript',
    code: `function getUserData(user) {\n  return user.profile.name;\n}\n\ngetUserData(undefined);`,
    error: `TypeError: Cannot read properties of undefined (reading 'profile')`
  },
  {
    name: 'Java NullPointer',
    language: 'java',
    code: `public class Main {\n    public static void main(String[] args) {\n        String text = null;\n        System.out.println(text.length());\n    }\n}`,
    error: `Exception in thread "main" java.lang.NullPointerException: Cannot invoke "String.length()" because "text" is null`
  },
  {
    name: 'C++ SegFault',
    language: 'cpp',
    code: `#include <iostream>\n\nint main() {\n    int* ptr = nullptr;\n    *ptr = 42;\n    return 0;\n}`,
    error: `Segmentation fault (core dumped) at line 5: *ptr = 42`
  }
];

export default function CodeEditor({
  code,
  setCode,
  error,
  setError,
  language,
  setLanguage,
  onAnalyze,
  isLoading
}) {
  const handleSelectPreset = (preset) => {
    setCode(preset.code);
    setError(preset.error);
    setLanguage(preset.language);
  };

  const handleClear = () => {
    setCode('');
    setError('');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5 shadow-2xl">
      
      {/* Top Bar / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        
        <div className="flex items-center space-x-2">
          <Code2 className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-200">Input Diagnostic Code & Exception</h2>
        </div>

        {/* Language selector & Controls */}
        <div className="flex items-center space-x-3">
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="auto">Language: Auto Detect</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript / TS</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </select>

          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 flex items-center space-x-1 mr-1">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Presets:</span>
        </span>
        {PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:border-slate-700 transition-all font-mono"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Code Input Area */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-300">
          Source Code Snippet
        </label>
        <div className="relative rounded-xl overflow-hidden border border-slate-800 focus-within:border-indigo-500/80 transition-all bg-slate-950">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code snippet here..."
            rows={8}
            className="w-full bg-slate-950 text-slate-200 font-mono text-sm p-4 focus:outline-none resize-y leading-relaxed"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Error Trace Input Area */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-300 flex items-center space-x-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
          <span>Error Stack Trace or Compiler Message</span>
        </label>
        <div className="relative rounded-xl overflow-hidden border border-slate-800 focus-within:border-indigo-500/80 transition-all bg-slate-950">
          <textarea
            value={error}
            onChange={(e) => setError(e.target.value)}
            placeholder="Paste raw compiler output, stack trace, or error message..."
            rows={4}
            className="w-full bg-slate-950 text-rose-300 font-mono text-xs p-4 focus:outline-none resize-y leading-relaxed"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Action Submit Button */}
      <div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isLoading || !code.trim() || !error.trim()}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isLoading || !code.trim() || !error.trim()
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 active:scale-[0.99] border border-indigo-500/30'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" />
              <span>Analyzing Code with AI Engine...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>Analyze & Fix Code</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
