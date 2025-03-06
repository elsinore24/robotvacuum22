import React, { useState } from 'react';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { searchAmazonProducts } from '../lib/amazonApi';
import ApiLogs from './ApiLogs';

interface SearchResult {
  SearchResult?: {
    Items?: Array<{
      ASIN: string;
      DetailPageURL: string;
      ItemInfo: {
        Title: { DisplayValue: string };
        ByLineInfo?: { Brand?: { DisplayValue: string } };
      };
      Images?: {
        Primary?: {
          Large?: { URL: string };
        };
      };
      Offers?: {
        Listings?: Array<{
          Price: {
            DisplayAmount: string;
            Amount: number;
          };
        }>;
      };
    }>;
    TotalResultCount?: number;
  };
  Errors?: Array<{ Message: string }>;
}

interface ApiLog {
  timestamp: string;
  type: 'error' | 'info' | 'warning';
  message: string;
  details?: any;
}

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const addLog = (log: ApiLog) => {
    setLogs(prev => [log, ...prev]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    
    addLog({
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Searching for "${searchTerm}"`,
    });
    
    try {
      const data = await searchAmazonProducts({
        keywords: searchTerm,
      });

      setResults(data);
      
      addLog({
        timestamp: new Date().toISOString(),
        type: 'info',
        message: `Found ${data.SearchResult?.TotalResultCount || 0} results`,
        details: {
          itemCount: data.SearchResult?.Items?.length || 0,
        }
      });
    } catch (err: any) {
      const errorLog = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message: err.message || 'Failed to search products',
        details: {
          name: err.name,
          stack: err.stack,
          cause: err.cause
        }
      };
      
      addLog(errorLog);
      setError(errorLog.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Product Search</h2>
        
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm.trim()}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-6 bg-red-50 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {results?.SearchResult?.Items && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">
              Found {results.SearchResult.TotalResultCount} results
            </h3>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {results.SearchResult.Items.map((item) => (
                <div key={item.ASIN} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  {item.Images?.Primary?.Large?.URL && (
                    <img
                      src={item.Images.Primary.Large.URL}
                      alt={item.ItemInfo.Title.DisplayValue}
                      className="w-full h-48 object-contain mb-4"
                    />
                  )}
                  <h4 className="font-medium mb-2">{item.ItemInfo.Title.DisplayValue}</h4>
                  {item.ItemInfo.ByLineInfo?.Brand && (
                    <p className="text-gray-600 text-sm mb-2">
                      Brand: {item.ItemInfo.ByLineInfo.Brand.DisplayValue}
                    </p>
                  )}
                  {item.Offers?.Listings?.[0]?.Price && (
                    <p className="text-lg font-bold text-blue-600">
                      {item.Offers.Listings[0].Price.DisplayAmount}
                    </p>
                  )}
                  <a
                    href={item.DetailPageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View on Amazon
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <ApiLogs logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
}
