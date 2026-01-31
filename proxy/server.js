import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

app.use(cors({ origin: (origin, cb) => {
  if (!origin) return cb(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
  cb(new Error('Not allowed by CORS'));
}}));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.send('EVE Gemini Proxy is running'));

app.post('/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });

    const { prompt, options } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Missing prompt in request body.' });

    // You can change endpoint/version as needed
    const endpoint = process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generate';

    const body = {
      prompt: { text: prompt },
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxTokens ?? 512
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await r.json();

    // Attempt to extract text from common response shapes
    const text = data?.candidates?.[0]?.content?.[0]?.text || data?.output?.[0]?.content?.text || data?.text || null;

    res.json({ text, raw: data });
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`EVE Gemini Proxy listening on http://localhost:${PORT}`);
});
