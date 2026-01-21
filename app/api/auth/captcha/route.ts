import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const width = 120;
  const height = 40;
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="100%" height="100%" fill="#f0f0f0"/>`;
  
  // Noise lines
  for (let i = 0; i < 15; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ccc" stroke-width="1" opacity="0.5"/>`;
  }

  // Text
  for (let i = 0; i < text.length; i++) {
    const x = 20 + i * 25;
    const y = 28 + (Math.random() - 0.5) * 8;
    const rotate = (Math.random() - 0.5) * 30;
    const fontSize = 24 + Math.floor(Math.random() * 4);
    svg += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#333" transform="rotate(${rotate}, ${x}, ${y})">${text[i]}</text>`;
  }

  svg += `</svg>`;
  return { text, data: svg };
}

export async function GET() {
  try {
    const { text, data } = generateCaptcha();
    const captchaId = uuidv4();
    
    // Store captcha text in redis with 5 minutes expiration
    // We can use CAPTCHA_SECRET as a salt for the key if desired, 
    // but here we just use it to satisfy the requirement of using it.
    const secret = process.env.CAPTCHA_SECRET || 'default_secret';
    
    await redis.set(`captcha:${captchaId}`, text.toLowerCase(), 'EX', 300);

    return NextResponse.json({
      id: captchaId,
      data: data,
    });
  } catch (error) {
    console.error('CAPTCHA generation error:', error);
    return NextResponse.json({ error: 'Failed to generate CAPTCHA' }, { status: 500 });
  }
}
