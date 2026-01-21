/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";

type Provider = "OPENROUTER" | "POE" | "HKBU";
type Model = "gpt-5" | "gpt-5-mini" | "gpt-4.1" | "gpt-4.1-mini";

// Map model names to actual provider model identifiers
function getModelName(provider: Provider, model: Model): string {
  if (provider === "OPENROUTER") {
    // Map to OpenRouter model names
    // Adjust these based on actual available models on OpenRouter
    const modelMap: Record<Model, string> = {
      "gpt-5": "openai/gpt-5", 
      "gpt-5-mini": "openai/gpt-5-mini", 
      "gpt-4.1": "openai/gpt-4.1",
      "gpt-4.1-mini": "openai/gpt-4.1-mini",
    };
    return modelMap[model];
  } else {
    // POE model names
    const modelMap: Record<Model, string> = {
      "gpt-5": "gpt-5-chat",
      "gpt-5-mini": "gpt-5-mini",
      "gpt-4.1": "gpt-4.1",
      "gpt-4.1-mini": "gpt-4.1-mini",
    };
    return modelMap[model];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required. Please provide a valid token." },
        { status: 401 }
      );
    }

    try {
      await verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token. Please login again." },
        { status: 401 }
      );
    }

    const { provider, model, messages, apiKey: clientApiKey } = await request.json();

    // Validate input
    if (!provider || !model || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Provider, model, and messages array are required" },
        { status: 400 }
      );
    }

    const providerType = provider as Provider;
    const modelType = model as Model;

    // Get API key from environment variables
    let apiKey: string | undefined;
    let baseURL: string;
    let defaultHeaders: Record<string, string> = {};

    if (providerType === "OPENROUTER") {
      apiKey = process.env.OPENROUTER_API_KEY;
      baseURL = "https://openrouter.ai/api/v1";
      defaultHeaders = {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "Bytewise AI",
      };
    } else if (providerType === "POE") {
      apiKey = process.env.POE_API_KEY;
      baseURL = "https://api.poe.com/v1";
    } else if (providerType === "HKBU") {
      // HKBU uses client-provided API key
      apiKey = clientApiKey;
      if (!apiKey) {
        return NextResponse.json(
          { error: "HKBU API key is required" },
          { status: 400 }
        );
      }
      // HKBU uses a different endpoint structure - model is in the URL
      const modelInUrl = modelType; // Use model directly in URL
      baseURL = `https://genai.hkbu.edu.hk/api/v0/rest/deployments/${modelInUrl}/chat/completions?api-version=2024-12-01-preview`;
    } else {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${providerType}` },
        { status: 500 }
      );
    }

    // Handle HKBU separately as it uses a different API structure
    if (providerType === "HKBU") {
      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
          "api-key": `${apiKey}`,
        },
        body: JSON.stringify({
          messages: messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
          top_p: 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HKBU API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return NextResponse.json(
        {
          message: data.choices?.[0]?.message?.content || "",
          usage: data.usage,
        },
        { status: 200 }
      );
    }

    // Create OpenAI client with provider-specific configuration for OPENROUTER and POE
    const client = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders,
    });

    // Get the actual model name for the provider
    const actualModelName = getModelName(providerType, modelType);

    // Make the API call
    const completion = await client.chat.completions.create({
      model: actualModelName,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return NextResponse.json(
      {
        message: completion.choices[0]?.message?.content || "",
        usage: completion.usage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to get chat completion",
        details: error.response?.data || error.cause,
      },
      { status: 500 }
    );
  }
}

