'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

function AuthForm() {
  const searchParams = useSearchParams();
  const tenant_key = searchParams.get('tenant_key');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAction = async (action: 'signup' | 'login') => {
    setMessage('Processing...');
    try {
      const res = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant_key }),
      });
      const data = await res.json();
      if (res.ok) {
        const successMessage = action === 'signup' ? 'Signed up successfully!' : 'Logged in successfully!';
        
        await Swal.fire({
          title: 'Success!',
          text: successMessage,
          icon: 'success',
          confirmButtonColor: '#3b82f6',
        });

        if (data.callback_url && data.token) {
          try {
            const url = new URL(data.callback_url);
            url.searchParams.append('token', data.token);
            setMessage('Redirecting to tenant...');
            window.location.href = url.toString();
            return;
          } catch (e) {
            console.error('Invalid callback URL:', data.callback_url);
            Swal.fire({
              title: 'Error!',
              text: 'Invalid callback URL configured for tenant.',
              icon: 'error',
              confirmButtonColor: '#ef4444',
            });
          }
        }

        if (data.token) {
          console.log('JWT Token:', data.token);
          if (action === 'login' && !data.callback_url) {
            window.location.href = '/user/dashboard';
          }
        }
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.error || 'Something went wrong',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: 'An unexpected error occurred.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Simple Auth Demo</h1>
      {tenant_key && (
        <p className="mb-4 text-sm text-gray-500">
          Authenticating for tenant: <span className="font-mono">{tenant_key}</span>
        </p>
      )}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 border rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('signup')}
            className="bg-blue-500 text-white p-2 rounded flex-1 cursor-pointer hover:bg-blue-600 transition-colors"
          >
            Sign Up
          </button>
          <button
            onClick={() => handleAction('login')}
            className="bg-green-500 text-white p-2 rounded flex-1 cursor-pointer hover:bg-green-600 transition-colors"
          >
            Login
          </button>
        </div>
        {message && <p className="mt-4 text-center text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
