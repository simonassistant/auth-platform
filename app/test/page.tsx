import Link from 'next/link';

const CLIENT_ID = 'test_client_public_id';
const CLIENT_SECRET = 'sk-test_key';
const REDIRECT_URI = 'http://localhost:3000/redirect';
const AUTH_BASE_URL = '/auth-provider/login';
const TOKEN_ENDPOINT = '/api/oauth/token';

export default function OAuthTestPage() {
  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = new URL(AUTH_BASE_URL, 'http://localhost:3000');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('state', state);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            OAuth 2.0 Authorization Server
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test the full OAuth flow in seconds. Follow the steps below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Client Info */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              🔑 Client Credentials
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Client ID</label>
                <code className="block w-full p-3 bg-gray-900 text-green-400 rounded-xl font-mono text-sm border border-gray-700">
                  {CLIENT_ID}
                </code>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Client Secret</label>
                <code className="block w-full p-3 bg-gray-900 text-green-400 rounded-xl font-mono text-sm border border-gray-700">
                  {CLIENT_SECRET}
                </code>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Redirect URI</label>
                <code className="block w-full p-3 bg-gray-900 text-green-400 rounded-xl font-mono text-sm border border-gray-700">
                  {REDIRECT_URI}
                </code>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Ensure these match your database exactly (especially redirect_urls as JSON array).
            </p>
          </div>

          {/* Step 1: Authorize */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              🚀 Step 1: Start Authorization
            </h2>
            <p className="text-gray-700 mb-6">
              Click below to redirect to the login page. Log in with a test user, authorize, and get redirected back with a code.
            </p>
            <Link
              href={authUrl.toString()}
              className="w-full block text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              👆 Authorize Application
            </Link>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800 font-mono break-all">{authUrl.toString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Step 2: Token Exchange (Automatic)</h2>
          <p className="text-gray-700 mb-6">
            After authorization, you&apos;ll be redirected to <code>/redirect</code> where the code is{' '}
            <strong>automatically exchanged for an access token</strong>.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/redirect"
              className="block text-center bg-indigo-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
            >
              🔄 Go to Callback (/redirect)
            </Link>
            <Link
              href="/test"
              className="block text-center bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
            >
              🔄 Refresh Test Page
            </Link>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl shadow-2xl text-white">
          <h3 className="text-2xl font-bold mb-6">💻 Manual cURL Test (Optional)</h3>
          <div className="bg-black/50 p-6 rounded-xl overflow-auto">
            <pre className="text-green-400 font-mono text-sm leading-relaxed">
{`curl -X POST http://localhost:3000${TOKEN_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "your-auth-code-here",
    "client_id": "${CLIENT_ID}",
    "client_secret": "${CLIENT_SECRET}"
  }'`}
            </pre>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need a test user? Check your <code>users</code> table. 
            Authorization codes expire in ~10 minutes and are single-use.
          </p>
        </div>
      </div>
    </div>
  );
}
