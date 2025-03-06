import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader, Key, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { searchAmazonProducts } from '../lib/amazonApi';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

export default function ConnectionTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const handleError = (error: any, testName: string) => {
    addResult({
      name: testName,
      status: 'error',
      message: error.message || 'An unknown error occurred',
      details: {
        name: error.name,
        code: error.code,
        stack: error.stack
      }
    });
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Test 1: Check Supabase Connection
      addResult({
        name: 'Supabase Connection',
        status: 'loading',
        message: 'Testing Supabase connection...'
      });

      try {
        // Log Supabase configuration
        addResult({
          name: 'Supabase Configuration',
          status: 'success',
          message: 'Supabase environment configuration',
          details: {
            url: import.meta.env.VITE_SUPABASE_URL,
            hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
            timestamp: new Date().toISOString()
          }
        });

        const { data, error } = await supabase
          .from('amazon_credentials')
          .select('*')
          .limit(1);

        if (error) throw error;

        addResult({
          name: 'Supabase Connection',
          status: 'success',
          message: 'Successfully connected to Supabase'
        });

        // Test 2: Check Amazon Credentials
        addResult({
          name: 'Amazon Credentials',
          status: 'loading',
          message: 'Checking Amazon credentials...'
        });

        if (!data || data.length === 0) {
          throw new Error('No Amazon credentials found in database');
        }

        const credentials = data[0];
        
        // Log Amazon credentials (safely)
        addResult({
          name: 'Amazon Credentials',
          status: 'success',
          message: 'Found valid Amazon credentials',
          details: {
            accessKey: credentials.access_key ? 
              `${credentials.access_key.slice(0, 4)}...${credentials.access_key.slice(-4)}` : 
              'Not available',
            partnerTag: credentials.partner_tag,
            marketplace: credentials.marketplace,
            region: credentials.region,
            status: credentials.status,
            lastSuccess: credentials.last_success_at,
            errorCount: credentials.error_count,
            rateLimitRemaining: credentials.rate_limit_remaining,
            rateLimitResetAt: credentials.rate_limit_reset_at
          }
        });

        // Test 3: Log API Endpoints
        const endpoints = {
          edge: {
            url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/amazon-pa-api`,
            method: 'GET',
            headers: ['Content-Type: application/json'],
            description: 'Supabase Edge Function endpoint'
          },
          amazon: {
            url: `https://${credentials.marketplace}/paapi5/searchitems`,
            method: 'POST',
            headers: [
              'Content-Type: application/json',
              'X-Amz-Target: com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'
            ],
            region: credentials.region,
            service: 'ProductAdvertisingAPI',
            description: 'Amazon Product Advertising API endpoint'
          }
        };
        
        addResult({
          name: 'API Configuration',
          status: 'success',
          message: 'API endpoints and configuration',
          details: {
            endpoints,
            timestamp: new Date().toISOString()
          }
        });

        // Test 4: Test Amazon API
        addResult({
          name: 'Amazon API',
          status: 'loading',
          message: 'Testing Amazon API connection...'
        });

        const searchResult = await searchAmazonProducts({
          keywords: 'test'
        });

        addResult({
          name: 'Amazon API',
          status: 'success',
          message: 'Successfully connected to Amazon API',
          details: {
            totalResults: searchResult.SearchResult?.TotalResultCount || 0,
            itemCount: searchResult.SearchResult?.Items?.length || 0,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error: any) {
        // Get the current test from the last result
        const currentTest = results[results.length - 1];
        handleError(error, currentTest?.name || 'Unknown Test');
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Connection Test</h2>
            <p className="text-sm text-gray-500 mt-1">
              Test connections to Supabase and Amazon PA API
            </p>
          </div>
          <button
            onClick={runTests}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? (
              <span className="flex items-center">
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Testing...
              </span>
            ) : (
              'Run Tests'
            )}
          </button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                result.status === 'success'
                  ? 'bg-green-50'
                  : result.status === 'error'
                  ? 'bg-red-50'
                  : 'bg-blue-50'
              }`}
            >
              <div className="flex items-start">
                {result.status === 'success' ? (
                  result.name === 'Amazon Credentials' ? (
                    <Key className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : result.name === 'API Configuration' ? (
                    <Globe className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  )
                ) : result.status === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                ) : (
                  <Loader className="h-5 w-5 text-blue-500 mt-0.5 animate-spin" />
                )}
                <div className="ml-3 flex-1">
                  <h3 className="font-medium">{result.name}</h3>
                  <p className={`text-sm ${
                    result.status === 'success'
                      ? 'text-green-700'
                      : result.status === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
                  }`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto max-h-48">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
