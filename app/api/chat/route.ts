import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth();
    if (auth.error) return auth.error;

    const userId = auth.userId;
    const { messages, model, stream, apiVersion } = await req.json();

    if (!messages || !model) {
      return NextResponse.json({ error: 'Missing messages or model' }, { status: 400 });
    }

    // Fetch user's API keys from database
    const users = await sql`SELECT api_keys FROM users WHERE id = ${userId} LIMIT 1`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let currentKeys = users[0].api_keys || {};
    if (typeof currentKeys === 'string') {
      currentKeys = JSON.parse(currentKeys);
    }

    let apiKey = '';
    let baseURL = '';
    let defaultHeaders: any = undefined;
    let defaultQuery: any = undefined;

    if (model.startsWith('hkbu')) {
      const rawKey = currentKeys.hkbu;
      if (!rawKey) {
        return NextResponse.json({ error: `API key for HKBU not found. Please add it in settings.` }, { status: 400 });
      }
      apiKey = rawKey.includes('_') ? rawKey.split('_')[1] : rawKey;
      const modelDeploymentName = model.split(':')[1] || 'gpt-4.1';
      baseURL = `https://genai.hkbu.edu.hk/api/v0/rest/deployments/${modelDeploymentName}`;
      defaultHeaders = { 'api-key': apiKey };
      if (apiVersion) {
        defaultQuery = { 'api-version': apiVersion };
      }
    } else {
      if (model.startsWith('openrouter')) {
        apiKey = currentKeys.openrouter;
        baseURL = 'https://openrouter.ai/api/v1';
      } else if (model.startsWith('kimi')) {
        apiKey = currentKeys.kimi;
        baseURL = 'https://api.moonshot.cn/v1';
      } else if (model.startsWith('blt')) {
        apiKey = currentKeys.blt;
        baseURL = 'https://api.bltcy.ai/v1';
      }

      if (!apiKey) {
        return NextResponse.json({ error: `API key for ${model} not found. Please add it in settings.` }, { status: 400 });
      }
      apiKey = apiKey.includes('_') ? apiKey.split('_')[1] : apiKey;
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
      defaultHeaders,
      defaultQuery,
    });

    if (stream) {
      const response = await openai.chat.completions.create({
        model: model.split(':')[1] || model, // Handle model names like "openrouter:openai/gpt-3.5-turbo"
        messages,
        stream: true,
      });

      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          } catch (err) {
            console.error('Stream error:', err);
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: model.split(':')[1] || model,
        messages,
        stream: false,
      });

      return NextResponse.json({ content: completion.choices[0].message.content });
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
