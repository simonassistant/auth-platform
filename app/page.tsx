"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-4xl">
        <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-2xl border border-gray-200/50 p-8 sm:p-12">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
                Welcome to Bytewise AI
              </h1>
              {user ? (
                <div className="space-y-6 mt-8">
                  <div className="backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-gray-200/50">
                    <p className="text-xl sm:text-2xl text-gray-800 mb-2">
                      Hello, <span className="font-bold text-blue-700">{user.name}</span>!
                    </p>
                    <p className="text-sm sm:text-base text-gray-700">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mt-4">
                  Get started by signing up or logging in to your account.
                </p>
              )}
            </div>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
                <Link
                  href="/signup"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white/50 hover:bg-white/60 backdrop-blur-md text-gray-800 font-semibold rounded-xl border border-gray-300/50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
