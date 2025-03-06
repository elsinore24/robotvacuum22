import React, { useState } from 'react';
import { AlertTriangle, XCircle, Clock, RefreshCw, Download, Trash2 } from 'lucide-react';

interface ErrorLogEntry {
  timestamp: string;
  message: string;
  context?: Record<string, any>;
  type: 'error' | 'warning' | 'info';
}

interface Props {
  logs: ErrorLogEntry[];
  onClear: () => void;
  onRefresh: () => void;
}

export default function ErrorLog({ logs, onClear, onRefresh }: Props) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const downloadLogs = () => {
    const logText = logs.map(log => {
      const context = log.context ? `\nContext: ${JSON.stringify(log.context, null, 2)}` : '';
      return `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}${context}`;
    }).join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Error Logs</h2>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border rounded-md px-2 py-1"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          <button
            onClick={onRefresh}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={downloadLogs}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Download Logs"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onClear}
            className="p-1 text-gray-600 hover:text-red-600"
            title="Clear Logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No logs to display
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  log.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : log.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {log.type === 'error' ? (
                      <XCircle className="h-5 w-5" />
                    ) : log.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="mt-1 text-xs opacity-75">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.context && (
                      <pre className="mt-2 text-xs whitespace-pre-wrap">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
