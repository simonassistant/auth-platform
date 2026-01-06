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
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!redirect_uri) {
      setMessage('Error: Missing redirect information');
      return;
    }

    setIsLoading(true);
    setMessage('');

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
        setMessage(data.error || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('OAuth login error:', err);
      setMessage('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  if (!redirect_uri) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Invalid Request</h1>
            <p className="mt-2 text-slate-500">The authentication request is missing required parameters.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Please enter your details to sign in</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm text-center ${message.includes('Error') || message.includes('failed') || message.includes('Invalid') ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Secure authentication powered by <span className="text-indigo-600">AuthProvider</span>
        </p>
      </div>
    </div>
  );
}

export default function OAuthLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <OAuthLoginForm />
    </Suspense>
  );
}
