# OAuth 2.0 Authorization Server Usage Guide

This server implements the standard **OAuth 2.0 Authorization Code Grant** flow. This is the recommended way to securely authorize your application to access user data without handling user passwords directly.

## Prerequisites

Before starting your integration, ensure you have the following:

* **Secure Connection:** All production requests must be accessed via `https://`.
* **Registered Client:** You must possess a valid `client_id` and `client_secret`.
* **Redirect URI:** A callback URL in your application where the authorization code will be sent.
* **User Registration:** Your users can register accounts at [our website](https://auth.hkbu.tech).
---

## 1. Register Your Client

To get started, contact the system administrator to register your application. You will need to provide your **Redirect URI(s)**. Once registered, you will receive your credentials:

* **Client ID:** A public identifier for your app (e.g., `myapp-123`).
* **Client Secret:** A private key that **must never be shared** or exposed in client-side code.

> **Note:** The `redirect_uri` you use in your requests must be an exact string match to the one registered in our system.

---

## 2. Request Authorization

To begin the flow, redirect the user's browser to our authorization endpoint. This allows the user to log in and grant your application permission.

**Endpoint:** `GET https://auth.hkbu.tech/auth-provider/login`

### Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| `client_id` | Yes | Your unique client identifier. |
| `redirect_uri` | Yes | The URL to return the user to after login. |
| `state` | No | A random string used to prevent CSRF attacks (highly recommended). |

**Example URL:**

```text
https://auth.hkbu.tech/auth-provider/login?client_id=your-client-id&redirect_uri=https://yourapp.com/callback&state=xyz123

```

### The Callback

After the user authenticates, they will be redirected back to your `redirect_uri` with a temporary code:
`https://yourapp.com/callback?code=abc123&state=xyz123`. You can verify the request against `state` to ensure that this is the request sent from your server, but this is optional.

---

## 3. Exchange Code for Access Token

Once you have the `code`, your **backend server** must exchange it for an Access Token. This must be a server-to-server POST request.

**Endpoint:** `POST https://auth.hkbu.tech/api/oauth/token`

**Content-Type:** `application/json`

### Request Body

```json
{
  "code": "abc123",
  "client_id": "your-client-id",
  "client_secret": "your-secret-here"
}

```

### Success Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}

```

---

## 4. Using the Access Token

The `access_token` is a JSON Web Token (JWT). Use this token to authenticate requests to protected API endpoints by including it in the HTTP header:

`Authorization: Bearer <your_access_token>`

### Token Claims

You can inspect the token payload at [jwt.io](https://jwt.io).

* **sub**: The unique User ID.
* **aud**: Your `client_id`.
* **exp**: The expiration timestamp (tokens are valid for 1 hour).

---
