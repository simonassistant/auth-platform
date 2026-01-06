'use client';

import React from 'react';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const content = `
# OAuth 2.0 Authorization Server Usage Guide

This server implements the standard **OAuth 2.0 Authorization Code Grant** flow. This is the recommended way to securely authorize your application to access user data without handling user passwords directly.

## Prerequisites

Before starting your integration, ensure you have the following:

* **Secure Connection:** All production requests must be accessed via \`https://\`.
* **Registered Client:** You must possess a valid \`client_id\` and \`client_secret\`.
* **Redirect URI:** A callback URL in your application where the authorization code will be sent.
* **User Registration:** Your users can register accounts at [our website](https://auth.hkbu.tech).
---

## 1. Register Your Client

To get started, contact the system administrator to register your application. You will need to provide your **Redirect URI(s)**. Once registered, you will receive your credentials:

* **Client ID:** A public identifier for your app (e.g., \`myapp-123\`).
* **Client Secret:** A private key that **must never be shared** or exposed in client-side code.

> **Note:** The \`redirect_uri\` you use in your requests must be an exact string match to the one registered in our system.

---

## 2. Request Authorization

To begin the flow, redirect the user's browser to our authorization endpoint. This allows the user to log in and grant your application permission.

**Endpoint:** \`GET https://auth.hkbu.tech/auth-provider/login\`

### Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| \`client_id\` | Yes | Your unique client identifier. |
| \`redirect_uri\` | Yes | The URL to return the user to after login. |
| \`state\` | No | A random string used to prevent CSRF attacks (highly recommended). |

The state must be stored in sessionStorage or HTTP only Cookies for safety.
**Example URL:**

\`\`\`text
https://auth.hkbu.tech/auth-provider/login?client_id=your-client-id&redirect_uri=https://yourapp.com/callback&state=xyz123
\`\`\`

### The Callback

After the user authenticates, they will be redirected back to your \`redirect_uri\` with a temporary code:
\`https://yourapp.com/callback?code=abc123&state=xyz123\`. You can verify the request against \`state\` to ensure that this is the request sent from your server, but this is optional.

---

## 3. Exchange Code for Access Token

Once you have the \`code\`, your **backend server** must exchange it for an Access Token. This must be a server-to-server POST request.

**Endpoint:** \`POST https://auth.hkbu.tech/api/oauth/token\`

**Content-Type:** \`application/json\`

### Request Body

\`\`\`json
{
  "code": "abc123",
  "client_id": "your-client-id",
  "client_secret": "your-secret-here"
}
\`\`\`

### Success Response (200 OK)

\`\`\`json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`
This token is a Bearer token, containing the following information
\`\`\`json
{
      "userId": "user.id",
      "email": "user.email",
      "aud": "client_id",
      "iat": 1712345678,
      "exp": 1712345678 + 3600 * 24 * 5
}
\`\`\`

---

## 4. Using the Access Token

The \`access_token\` is a JSON Web Token (JWT). Use this token to authenticate requests to protected API endpoints by including it in the HTTP header:

\`Authorization: Bearer <your_access_token>\`

### Token Claims

You can inspect the token payload at [jwt.io](https://jwt.io).

* **sub**: The unique User ID.
* **aud**: Your \`client_id\`.
* **exp**: The expiration timestamp (tokens are valid for 1 hour).

---

## 5. API Reference

### Authentication for Protected Endpoints
All requests to the following endpoints must be authenticated.
- **Format:** The \`access_token\` obtained from the token exchange.
- **Placement:**
  - **Headers:** The bearar token must be placed in the request headers.

---

### User API Keys
Manage your external provider API keys (HKBU, OpenRouter, Kimi, etc.).

#### **GET** \`/api/user/api-keys\`
Fetch all stored API keys for the authenticated user.

**Response (200 OK):**
\`\`\`json
{
  "api_keys": {
    "hkbu": "hkbu_...",
    "openrouter": "openrouter_...",
    "kimi": "kimi_..."
  }
}
\`\`\`

#### **POST** \`/api/user/api-keys\`
Update or add an API key for a specific provider.

**Request Body:**
\`\`\`json
{
  "keyType": "hkbu",
  "apiKey": "your-actual-api-key"
}
\`\`\`
*Note: The server automatically prefixes the key with the provider name (e.g., \`hkbu_\`).*

---

### Chat Completions
Send messages to various AI models using your stored API keys.

#### **POST** \`/api/chat\`
Proxies requests to the selected provider.

**Request Body:**
\`\`\`json
{
  "model": "provider:model_name",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "apiVersion": "2024-02-15-preview"
}
\`\`\`

**Model Format Examples:**
- \`hkbu:gpt-4.1\`
- \`openrouter:openai/gpt-4-turbo\`
- \`kimi:moonshot-v1-8k\`

**Parameters:**
- \`model\` (Required): String in \`provider:model\` format.
- \`messages\` (Required): Array of message objects.
- \`stream\` (Optional): Boolean. If \`true\`, returns a \`text/plain\` stream of tokens.
- \`apiVersion\` (Optional): Specifically for HKBU requests.

**Success Response (200 OK):**
\`\`\`json
{
  "content": "Hello! How can I help you today?"
}
\`\`\`
`;

export default function DocsPage() {
  const htmlContent = md.render(content);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md prose prose-blue max-w-none">
        <div 
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>
      <style jsx global>{`
        .markdown-body h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        .markdown-body h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25rem; }
        .markdown-body h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.6; color: #374151; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .markdown-body li { margin-bottom: 0.5rem; }
        .markdown-body code { background-color: #f3f4f6; padding: 0.2rem 0.4rem; rounded: 0.25rem; font-family: monospace; font-size: 0.875em; }
        .markdown-body pre { background-color: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
        .markdown-body pre code { background-color: transparent; padding: 0; color: inherit; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .markdown-body th, .markdown-body td { border: 1px solid #e5e7eb; padding: 0.75rem; text-align: left; }
        .markdown-body th { background-color: #f9fafb; font-weight: 600; }
        .markdown-body blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; font-style: italic; color: #4b5563; margin-bottom: 1rem; }
        .markdown-body hr { border: 0; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
        .markdown-body a { color: #2563eb; text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
