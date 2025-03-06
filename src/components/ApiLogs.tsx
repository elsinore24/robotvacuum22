import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface ApiLog {
  timestamp: string;
  type: 'error' | 'info' | 'warning';
  message: string;
  details?: any;
}

interface Props {
  logs: ApiLog[];
  onClear: () => void;
}

export default function ApiLogs({ logs, onClear }: Props) {
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">API Logs</h3>
        <div className="space-x-2">
          <button
            onClick={onClear}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No logs to display
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
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
                      <AlertCircle className="h-5 w-5" />
                    ) : log.type === 'warning' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{log.message}</p>
                    <p className="mt-1 text-xs opacity-75">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.details && (
                      <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-32">
                        {JSON.stringify(log.details, null, 2)}
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
