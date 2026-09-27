import React from 'react';
import { X, History, ChevronRight, Clock, Code } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, historyLogs, onSelectLog }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Analysis History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No previous analysis sessions recorded yet.
            </div>
          ) : (
            historyLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => {
                  onSelectLog(log);
                  onClose();
                }}
                className="group p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-indigo-300">
                    {log.id}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <p className="text-xs font-mono text-slate-300 line-clamp-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900">
                  {log.input?.code || 'Source code'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="text-rose-400 font-mono truncate max-w-[200px]">
                    {log.analysis?.rootCause || 'Root cause breakdown'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-center">
          <p className="text-[11px] text-slate-500">
            Records stored securely via Cloud Storage Layer
          </p>
        </div>

      </div>
    </div>
  );
}
