import React from 'react';

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-bold mb-8">OAuth 2.0 Authorization Server Usage Guide</h1>

      <p className="mb-6">
        This server implements the standard <strong>OAuth 2.0 Authorization Code Grant</strong> flow. This is the recommended way to securely authorize your application to access user data without handling user passwords directly.
      </p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Prerequisites</h2>
        <p className="mb-4">Before starting your integration, ensure you have the following:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Secure Connection:</strong> All production requests must be accessed via <code>https://</code>.</li>
          <li><strong>Registered Client:</strong> You must possess a valid <code>client_id</code> and <code>client_secret</code>.</li>
          <li><strong>Redirect URI:</strong> A callback URL in your application where the authorization code will be sent.</li>
          <li><strong>User Registration:</strong> Your users can register accounts at <a href="https://auth.hkbu.tech" className="text-blue-600 hover:underline">our website</a>.</li>
        </ul>
      </section>

      <hr className="my-10 border-gray-300 dark:border-gray-700" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">1. Register Your Client</h2>
        <p className="mb-4">
          To get started, contact the system administrator to register your application. You will need to provide your <strong>Redirect URI(s)</strong>. Once registered, you will receive your credentials:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><strong>Client ID:</strong> A public identifier for your app (e.g., <code>myapp-123</code>).</li>
          <li><strong>Client Secret:</strong> A private key that <strong>must never be shared</strong> or exposed in client-side code.</li>
        </ul>
        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 italic">
          <strong>Note:</strong> The <code>redirect_uri</code> you use in your requests must be an exact string match to the one registered in our system.
        </blockquote>
      </section>

      <hr className="my-10 border-gray-300 dark:border-gray-700" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">2. Request Authorization</h2>
        <p className="mb-4">
          To begin the flow, redirect the user's browser to our authorization endpoint. This allows the user to log in and grant your application permission.
        </p>
        <p className="mb-2"><strong>Endpoint:</strong> <code>GET https://auth.hkbu.tech/auth-provider/login</code></p>

        <h3 className="text-xl font-medium mt-6 mb-3">Query Parameters</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-700 mb-6">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 border">Parameter</th>
                <th className="px-4 py-2 border">Required</th>
                <th className="px-4 py-2 border">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border"><code>client_id</code></td>
                <td className="px-4 py-2 border">Yes</td>
                <td className="px-4 py-2 border">Your unique client identifier.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border"><code>redirect_uri</code></td>
                <td className="px-4 py-2 border">Yes</td>
                <td className="px-4 py-2 border">The URL to return the user to after login.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border"><code>state</code></td>
                <td className="px-4 py-2 border">No</td>
                <td className="px-4 py-2 border">A random string used to prevent CSRF attacks (highly recommended).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mb-4 italic">The state must be stored in sessionStorage or HTTP only Cookies for safety.</p>

        <p className="mb-2"><strong>Example URL:</strong></p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>https://auth.hkbu.tech/auth-provider/login?client_id=your-client-id&amp;redirect_uri=https://yourapp.com/callback&amp;state=xyz123</code>
        </pre>

        <h3 className="text-xl font-medium mt-6 mb-3">The Callback</h3>
        <p className="mb-4">
          After the user authenticates, they will be redirected back to your <code>redirect_uri</code> with a temporary code:
          <br />
          <code>https://yourapp.com/callback?code=abc123&amp;state=xyz123</code>.
          <br />
          You can verify the request against <code>state</code> to ensure that this is the request sent from your server, but this is optional.
        </p>
      </section>

      <hr className="my-10 border-gray-300 dark:border-gray-700" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">3. Exchange Code for Access Token</h2>
        <p className="mb-4">
          Once you have the <code>code</code>, your <strong>backend server</strong> must exchange it for an Access Token. This must be a server-to-server POST request.
        </p>
        <p className="mb-2"><strong>Endpoint:</strong> <code>POST https://auth.hkbu.tech/api/oauth/token</code></p>
        <p className="mb-4"><strong>Content-Type:</strong> <code>application/json</code></p>

        <h3 className="text-xl font-medium mt-6 mb-3">Request Body</h3>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "code": "abc123",
  "client_id": "your-client-id",
  "client_secret": "your-secret-here"
}, null, 2)}</code>
        </pre>

        <h3 className="text-xl font-medium mt-6 mb-3">Success Response (200 OK)</h3>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}, null, 2)}</code>
        </pre>
        <p className="mb-4">This token is a Bearer token, containing the following information:</p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>{`{
  userId: user.id,
  email: user.email,
  aud: client_id,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 5, // 5 days
}`}</code>
        </pre>
      </section>

      <hr className="my-10 border-gray-300 dark:border-gray-700" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">4. Using the Access Token</h2>
        <p className="mb-4">
          The <code>access_token</code> is a JSON Web Token (JWT). Use this token to authenticate requests to protected API endpoints by including it in the HTTP header:
        </p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>Authorization: Bearer &lt;your_access_token&gt;</code>
        </pre>

        <h3 className="text-xl font-medium mt-6 mb-3">Token Claims</h3>
        <p className="mb-4">You can inspect the token payload at <a href="https://jwt.io" className="text-blue-600 hover:underline">jwt.io</a>.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>sub</strong>: The unique User ID.</li>
          <li><strong>aud</strong>: Your <code>client_id</code>.</li>
          <li><strong>exp</strong>: The expiration timestamp (tokens are valid for 5 days as per the response above, though the <code>expires_in</code> says 1 hour, the payload shows 5 days).</li>
        </ul>
      </section>

      <hr className="my-10 border-gray-300 dark:border-gray-700" />

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">5. API Reference</h2>
        <h3 className="text-xl font-medium mt-6 mb-3">Authentication for Protected Endpoints</h3>
        <p className="mb-4">All requests to the following endpoints must be authenticated.</p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li><strong>Format:</strong> The <code>access_token</code> obtained from the token exchange.</li>
          <li><strong>Placement:</strong>
            <ul className="list-circle pl-6 mt-2">
              <li><strong>Headers:</strong> The bearer token must be placed in the request headers.</li>
            </ul>
          </li>
        </ul>

        <h3 className="text-xl font-bold mt-10 mb-4 border-t pt-6">User API Keys</h3>
        <p className="mb-4">Manage your external provider API keys (HKBU, OpenRouter, Kimi, etc.).</p>

        <h4 className="text-lg font-semibold mb-2 mt-6"><span className="text-green-600">GET</span> /api/user/api-keys</h4>
        <p className="mb-4">Fetch all stored API keys for the authenticated user.</p>
        <p className="mb-2"><strong>Response (200 OK):</strong></p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "api_keys": {
    "hkbu": "hkbu_...",
    "openrouter": "openrouter_...",
    "kimi": "kimi_..."
  }
}, null, 2)}</code>
        </pre>

        <h4 className="text-lg font-semibold mb-2 mt-6"><span className="text-blue-600">POST</span> /api/user/api-keys</h4>
        <p className="mb-4">Update or add an API key for a specific provider.</p>
        <p className="mb-2"><strong>Request Body:</strong></p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "keyType": "hkbu",
  "apiKey": "your-actual-api-key"
}, null, 2)}</code>
        </pre>
        <p className="mb-4 italic">Note: The server automatically prefixes the key with the provider name (e.g., <code>hkbu_</code>).</p>
        <p className="mb-6">
          There is no deleting a key. If you want to delete a key, just set the value to an empty string, and check the string length. If the length is shorter than 10, then it can be considered empty.
        </p>

        <h3 className="text-xl font-bold mt-10 mb-4 border-t pt-6">Chat Completions</h3>
        <p className="mb-4">Send messages to various AI models using your stored API keys.</p>

        <h4 className="text-lg font-semibold mb-2 mt-6"><span className="text-blue-600">POST</span> /api/chat</h4>
        <p className="mb-4">Proxies requests to the selected provider.</p>
        <p className="mb-2"><strong>Request Body:</strong></p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "model": "provider:model_name",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "apiVersion": "2024-02-15-preview"
}, null, 2)}</code>
        </pre>

        <p className="mb-4"><strong>Model Format Examples:</strong></p>
        <ul className="list-disc pl-6 space-y-1 mb-6">
          <li><code>hkbu:gpt-4.1</code></li>
          <li><code>openrouter:openai/gpt-4-turbo</code></li>
          <li><code>kimi:moonshot-v1-8k</code></li>
        </ul>

        <p className="mb-4"><strong>Parameters:</strong></p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li><code>model</code> (Required): String in <code>provider:model</code> format.</li>
          <li><code>messages</code> (Required): Array of message objects.</li>
          <li><code>stream</code> (Optional): Boolean. If <code>true</code>, returns a <code>text/plain</code> stream of tokens.</li>
          <li><code>apiVersion</code> (Optional): Specifically for HKBU requests.</li>
        </ul>

        <p className="mb-2"><strong>Success Response (200 OK):</strong></p>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-6 overflow-x-auto text-sm">
          <code>{JSON.stringify({
  "content": "Hello! How can I help you today?"
}, null, 2)}</code>
        </pre>
      </section>
    </div>
  );
}
