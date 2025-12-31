'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RedirectCallback() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const client_id = 'test_client_public_id';
  const client_secret = 'sk-test_key';

  const exchangeCodeForToken = async (codeToExchange) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToExchange,
          client_id,
          client_secret,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTokenData(data);
      } else {
        setError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(`Exchange failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) {
      exchangeCodeForToken(code);
    }
  }, [code]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">OAuth 2.0 Callback</h1>
        
        {code ? (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-800 mb-2">Received:</p>
              <p><strong>Code:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-sm">{code}</code></p>
              {state && (
                <p><strong>State:</strong> <code className="bg-green-100 px-2 py-1 rounded text-sm">{state}</code></p>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Exchanging code for token...</p>
              </div>
            ) : tokenData ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Token Received!</h2>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto font-mono text-sm">
                  {JSON.stringify(tokenData, null, 2)}
                </pre>
              </div>
            ) : error ? (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-red-800">❌ Exchange Failed</h2>
                <pre className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg overflow-auto font-mono text-sm">
                  {error}
                </pre>
                {code && (
                  <button
                    onClick={() => exchangeCodeForToken(code)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Retry Exchange
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Ready to exchange code. Click below if not automatic.
                <button
                  onClick={() => exchangeCodeForToken(code)}
                  className="mt-4 block mx-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Exchange Code for Token
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No authorization code received.</p>
            <p className="mt-2 text-sm">This page is the OAuth callback endpoint.</p>
            <a href="/test" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to Test Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
