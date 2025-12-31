'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthLoginForm() {
  const searchParams = useSearchParams();
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!client_id || !redirect_uri) {
      setMessage('Error: Missing client_id or redirect_uri');
      return;
    }

    setMessage('Logging in...');
    try {
      const res = await fetch('/api/oauth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, client_id, redirect_uri, state }),
      });
      const data = await res.json();
      
      if (res.ok && data.redirect_url) {
        setMessage('Success! Redirecting...');
        window.location.href = data.redirect_url;
      } else {
        setMessage(`Error: ${data.error || 'Login failed'}`);
      }
    } catch (err) {
      console.error('OAuth login error:', err);
      setMessage('An unexpected error occurred.');
    }
  };

  if (!client_id || !redirect_uri) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Invalid OAuth Request</p>
          <p>Missing required parameters: <code>client_id</code> and <code>redirect_uri</code> are required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">OAuth Login</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Logging in to authorize application with ID: <span className="font-mono bg-gray-100 px-1 rounded">{client_id}</span>
        </p>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-2 border rounded text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-2 border rounded text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white p-2 rounded font-semibold hover:bg-blue-700 transition-colors mt-2"
          >
            Authorize & Login
          </button>
          
          {message && (
            <p className={`mt-4 text-center text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-blue-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OAuthLoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading OAuth flow...</div>}>
      <OAuthLoginForm />
    </Suspense>
  );
}
