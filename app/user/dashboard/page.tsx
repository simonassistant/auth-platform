'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function Dashboard() {
    const [keyType, setKeyType] = useState('Openrouter');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingKeys, setExistingKeys] = useState<Record<string, string>>({});

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/user/api-keys');
            const data = await res.json();
            if (res.ok) {
                setExistingKeys(data.api_keys || {});
            }
        } catch (err) {
            console.error('Failed to fetch keys:', err);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleSaveKey = async () => {
        if (!apiKey) {
            Swal.fire('Error', 'Please enter an API key', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/user/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyType, apiKey }),
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire('Success', 'API key saved successfully!', 'success');
                setApiKey('');
                fetchKeys();
            } else {
                Swal.fire('Error', data.error || 'Failed to save API key', 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
            <div className="flex justify-between items-center w-full max-w-2xl">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Link 
                    href="/user/chat" 
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                    Go to Chat
                </Link>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-md bg-white p-6 rounded shadow-md">
                <h2 className="text-lg font-semibold mb-2 text-black">Add/Update API Key</h2>
                <label className="text-sm font-medium text-gray-700">Select API Key Type</label>
                <select
                    className="p-2 border rounded text-black"
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value)}
                >
                    <option value="Openrouter">Openrouter</option>
                    <option value="BLT">BLT</option>
                    <option value="Kimi">Kimi</option>
                    <option value="HKBU">HKBU</option>
                </select>

                <label className="text-sm font-medium text-gray-700">API Key</label>
                <input
                    type="password"
                    placeholder="Enter your API key"
                    className="p-2 border rounded text-black"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                />

                <button
                    onClick={handleSaveKey}
                    disabled={loading}
                    className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                >
                    {loading ? 'Saving...' : 'Save API Key'}
                </button>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-md bg-white p-6 rounded shadow-md">
                <h2 className="text-lg font-semibold mb-2 text-black">Existing API Keys</h2>
                <div className="flex flex-col gap-2">
                    {Object.entries(existingKeys).length > 0 ? (
                        Object.entries(existingKeys).map(([type, key]) => (
                            <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                <span className="font-medium capitalize text-black">{type}:</span>
                                <span className="text-gray-600 text-sm truncate ml-2" title={key}>
                                    {key}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm italic text-center">No API keys saved yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
