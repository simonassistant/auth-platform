"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    captchaValue: "",
  });
  const [captcha, setCaptcha] = useState<{ id: string; data: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const response = await fetch("/api/auth/captcha");
      const data = await response.json();
      setCaptcha(data);
    } catch (err) {
      console.error("Failed to fetch captcha", err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          captchaId: captcha?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sign up");
        setLoading(false);
        fetchCaptcha(); // Refresh captcha on error
        return;
      }

      // Redirect to login page on success
      router.push("/login?message=Sign up successful! Please log in.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/30 rounded-3xl shadow-2xl border border-gray-200/50 p-8 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Sign Up
          </h1>
          <p className="text-gray-700 text-sm">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} method="POST" className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              placeholder="Retype your password"
            />
          </div>

          <div>
            <label
              htmlFor="captcha"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              CAPTCHA
            </label>
            <div className="flex gap-4 items-center">
              <input
                id="captcha"
                type="text"
                required
                value={formData.captchaValue}
                onChange={(e) =>
                  setFormData({ ...formData, captchaValue: e.target.value })
                }
                className="flex-1 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                placeholder="Enter CAPTCHA"
              />
              {captcha && (
                <div
                  className="cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-300 h-[50px] flex items-center min-w-[120px] justify-center [&>svg]:h-full [&>svg]:w-full"
                  onClick={fetchCaptcha}
                  dangerouslySetInnerHTML={{ __html: captcha.data }}
                  title="Click to refresh"
                />
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-100 backdrop-blur-md p-4 text-sm text-red-800 border border-red-300">
              {error}
            </div>
          )}

          <div className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
            By signing up, you agree to our{" "}
            <a
              href="https://bupdpo.hkbu.edu.hk/content/ito/en/_jcr_content.ssocheck.json?pathPdf=/content/dam/bupdpo-assets/HKBU-Privacy-Policy-Statement-cum-PICS-v40-for-upload-12-Aug-2021.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline font-medium"
            >
              Personal Information Collection Statement (PICS)
            </a>
            .
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            Log in
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
