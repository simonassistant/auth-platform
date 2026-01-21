"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Provider = "OPENROUTER" | "POE" | "HKBU";
type Model = "gpt-5" | "gpt-5-mini" | "gpt-4.1" | "gpt-4.1-mini";

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [provider, setProvider] = useState<Provider>("OPENROUTER");
  const [model, setModel] = useState<Model>("gpt-5");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hkbuApiKey, setHkbuApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing user data:", e);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      // Load saved HKBU API key if exists
      const savedApiKey = localStorage.getItem("hkbu_api_key");
      if (savedApiKey) {
        setHkbuApiKey(savedApiKey);
      }
      // Load saved provider and model if they exist
      const savedProvider = localStorage.getItem("selected_provider");
      const savedModel = localStorage.getItem("selected_model");
      if (savedProvider && (savedProvider === "OPENROUTER" || savedProvider === "POE" || savedProvider === "HKBU")) {
        setProvider(savedProvider as Provider);
      }
      if (savedModel && (savedModel === "gpt-5" || savedModel === "gpt-5-mini" || savedModel === "gpt-4.1" || savedModel === "gpt-4.1-mini")) {
        setModel(savedModel as Model);
      }
      // Load saved chat history if it exists
      const savedMessages = localStorage.getItem("chat_history");
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages)) {
            setMessages(parsedMessages);
          }
        } catch (e) {
          console.error("Error parsing chat history:", e);
        }
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/");
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("chat_history");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target as Node)
      ) {
        setProviderDropdownOpen(false);
      }
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      // Get JWT token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        router.push("/login");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider,
          model,
          messages: newMessages,
          ...(provider === "HKBU" && { apiKey: hkbuApiKey }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
          router.push("/login");
          return;
        }
        setError(data.error || "Failed to get response");
        setLoading(false);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "No response received",
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Collapsible Left Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden bg-white/20 backdrop-blur-xl border-r border-gray-200/50 flex flex-col`}
      >
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="backdrop-blur-md bg-white/40 rounded-2xl p-4 border border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Settings</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Logged in as</p>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Provider
            </label>
            <div className="relative" ref={providerDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setProviderDropdownOpen(!providerDropdownOpen);
                  setModelDropdownOpen(false);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all flex items-center justify-between hover:bg-white/80"
              >
                <span>{provider}</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    providerDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {providerDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const newProvider = "OPENROUTER";
                      setProvider(newProvider);
                      setProviderDropdownOpen(false);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("selected_provider", newProvider);
                      }
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-all duration-200 ${
                      provider === "OPENROUTER"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-gray-800 hover:bg-white/60"
                    }`}
                  >
                    OPENROUTER
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newProvider = "POE";
                      setProvider(newProvider);
                      setProviderDropdownOpen(false);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("selected_provider", newProvider);
                      }
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-all duration-200 ${
                      provider === "POE"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-gray-800 hover:bg-white/60"
                    }`}
                  >
                    POE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newProvider = "HKBU";
                      setProvider(newProvider);
                      setProviderDropdownOpen(false);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("selected_provider", newProvider);
                      }
                    }}
                    className={`w-full px-4 py-3 text-left font-semibold transition-all duration-200 ${
                      provider === "HKBU"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        : "text-gray-800 hover:bg-white/60"
                    }`}
                  >
                    HKBU
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* HKBU API Key Input */}
          {provider === "HKBU" && (
            <div className="space-y-3">
              <label htmlFor="hkbu-api-key" className="block text-sm font-semibold text-gray-800">
                HKBU API Key
              </label>
              <input
                id="hkbu-api-key"
                type="password"
                value={hkbuApiKey}
                onChange={(e) => {
                  const newKey = e.target.value;
                  setHkbuApiKey(newKey);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("hkbu_api_key", newKey);
                  }
                }}
                placeholder="Enter your HKBU API key"
                className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              <p className="text-xs text-gray-500">
                Your API key is stored locally in your browser
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Model
            </label>
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setModelDropdownOpen(!modelDropdownOpen);
                  setProviderDropdownOpen(false);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 font-semibold text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all flex items-center justify-between hover:bg-white/80"
              >
                <span>{model}</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                    modelDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {modelDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-xl overflow-hidden">
                  {(["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4.1-mini"] as Model[]).map(
                    (modelOption) => (
                      <button
                        key={modelOption}
                        type="button"
                        onClick={() => {
                          setModel(modelOption);
                          setModelDropdownOpen(false);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("selected_model", modelOption);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left font-semibold text-sm transition-all duration-200 ${
                          model === modelOption
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            : "text-gray-800 hover:bg-white/60"
                        }`}
                      >
                        {modelOption}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 mt-6"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/30 border-b border-gray-200/50 p-4 flex items-center justify-between">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Open sidebar"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Bytewise AI Chat
            </h1>
          </div>
          <button
            onClick={handleNewChat}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            title="Start a new chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-gray-200/50">
                <p className="text-gray-700">
                  Welcome to Bytewise AI Chat! Select a provider and model from the sidebar to get started.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200/50">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Provider:</span> {provider}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Model:</span> {model}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`backdrop-blur-md rounded-2xl p-6 border ${
                    message.role === "user"
                      ? "bg-blue-50/40 border-blue-200/50 ml-auto max-w-[80%]"
                      : "bg-white/40 border-gray-200/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      {message.role === "user" ? "U" : "AI"}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold text-sm">
                    AI
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="backdrop-blur-md bg-red-100/40 rounded-2xl p-4 border border-red-300/50">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="backdrop-blur-xl bg-white/30 border-t border-gray-200/50 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} method="POST" className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
