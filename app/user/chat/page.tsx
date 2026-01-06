'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ChatPage() {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState('openrouter');
    const [selectedModel, setSelectedModel] = useState('gpt-5.2');
    const [apiVersion, setApiVersion] = useState('');

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            console.log('Sending request to /api/chat', { streaming, selectedModel, selectedProvider, apiVersion });
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: newMessages,
                    model: `${selectedProvider}:${selectedModel}`,
                    stream: selectedProvider === 'hkbu' ? false : streaming,
                    apiVersion: selectedProvider === 'hkbu' ? apiVersion : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Response error:', errorData);
                throw new Error(errorData.error || 'Failed to fetch response');
            }

            if (streaming) {
                console.log('Starting to read stream...');
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = { role: 'assistant', content: '' };
                setMessages((prev) => [...prev, assistantMessage]);

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('Stream done');
                            break;
                        }
                        const chunk = decoder.decode(value, { stream: true });
                        console.log('Received chunk:', chunk);
                        assistantMessage.content += chunk;
                        setMessages((prev) => {
                            const updated = [...prev];
                            updated[updated.length - 1] = { ...assistantMessage };
                            return updated;
                        });
                    }
                }
            } else {
                const data = await response.json();
                console.log('Non-streaming response:', data);
                setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Chat</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedProvider}
                        onChange={(e) => {
                            const newProvider = e.target.value;
                            setSelectedProvider(newProvider);
                            // Set default model for the provider
                            if (newProvider === 'hkbu') {
                                setSelectedModel('gpt-4.1');
                            } else {
                                setSelectedModel('gpt-5.2');
                            }
                        }}
                        className="p-2 border rounded text-black bg-white"
                    >
                        <option value="openrouter">OpenRouter</option>
                        <option value="kimi">Kimi</option>
                        <option value="blt">BLT</option>
                        <option value="hkbu">HKBU</option>
                    </select>
                    {selectedProvider === 'hkbu' && (
                        <input
                            type="text"
                            placeholder="API Version (optional)"
                            value={apiVersion}
                            onChange={(e) => setApiVersion(e.target.value)}
                            className="p-2 border rounded text-black bg-white w-32"
                        />
                    )}
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="p-2 border rounded text-black bg-white"
                    >
                        {selectedProvider === 'hkbu' ? (
                            <>
                                <option value="gpt-4.1">gpt-4.1</option>
                            </>
                        ) : (
                            <>
                                <option value="gpt-5.2">gpt-5.2</option>
                                <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                            </>
                        )}
                    </select>
                    <button
                        onClick={() => setStreaming(!streaming)}
                        disabled={selectedProvider === 'hkbu'}
                        className={`px-3 py-1 rounded text-sm font-medium ${streaming && selectedProvider !== 'hkbu' ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'}`}
                    >
                        Streaming: {streaming && selectedProvider !== 'hkbu' ? 'ON' : 'OFF'}
                    </button>
                    <Link href="/user/dashboard" className="text-blue-500 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
                {messages.length === 0 && (
                    <p className="text-gray-500 text-center mt-10">Start a conversation...</p>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border text-black'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && !streaming && <div className="text-gray-500 italic">Thinking...</div>}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border rounded text-black"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
