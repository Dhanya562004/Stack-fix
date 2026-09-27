import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import AnalysisResult from './components/AnalysisResult';
import HistoryDrawer from './components/HistoryDrawer';
import { analyzeCodePayload, fetchHealthStatus, fetchAnalysisHistory } from './services/api';

export default function App() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('auto');
  
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [health, setHealth] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Fetch system status & history on mount
  useEffect(() => {
    loadHealthAndHistory();
  }, []);

  const loadHealthAndHistory = async () => {
    const healthData = await fetchHealthStatus();
    if (healthData) setHealth(healthData);

    const historyData = await fetchAnalysisHistory();
    if (historyData) setHistoryLogs(historyData);
  };

  const handleAnalyze = async () => {
    if (!code.trim() || !error.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const response = await analyzeCodePayload({ code, error, language });
      setAnalysisResult(response);
      
      // Refresh history logs after new analysis
      loadHealthAndHistory();
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred while analyzing the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryLog = (log) => {
    if (log.input) {
      setCode(log.input.code || '');
      setError(log.input.error || '');
      setLanguage(log.input.language || 'auto');
    }
    setAnalysisResult({ data: log });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Top Header Navigation */}
      <Header
        health={health}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyLogs.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error Banner */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-semibold text-rose-300 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Input & Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Code & Error Input */}
          <CodeEditor
            code={code}
            setCode={setCode}
            error={error}
            setError={setError}
            language={language}
            setLanguage={setLanguage}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          {/* Right Column: AI Analysis Result */}
          <div className="space-y-6">
            {analysisResult ? (
              <AnalysisResult result={analysisResult} />
            ) : (
              <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800/80">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-base font-bold text-slate-200">
                  Ready for AI Code Diagnostics
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Enter source code and stack trace on the left panel or click a preset to instantly view the AI-generated root cause, explanation, and corrected code.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Slide-over History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyLogs={historyLogs}
        onSelectLog={handleSelectHistoryLog}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>StackFix AI Platform • Production SaaS Engine • Built with Express.js, React, Gemini API & AWS Cloud Storage Architecture</p>
      </footer>

    </div>
  );
}
