// Vercel serverless endpoint for the SizeItNow AI helper.
// Add OPENAI_API_KEY in Vercel Project Settings → Environment Variables.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to send a message.' });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'The AI assistant is not configured yet. The site owner needs to add OPENAI_API_KEY in Vercel settings.' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const incoming = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const messages = [{
      role: 'system',
      content: 'You are SizeItNow AI, a friendly concise support assistant for SizeItNow, a free browser-based image utility. Help users compress images to target KB sizes, choose JPG/PNG/WebP, select low/medium/high quality and original/square/portrait/custom frames, combine up to 20 images into one PDF, and convert PDF pages to individual PNG/JPG/WebP downloads. Explain that image processing normally happens in the browser. Do not claim to see, access, or process the user’s files or account. Do not ask for passwords, payment information, or sensitive personal data. Stay focused on product help; for unresolved issues direct users to iamanshuthakur@gmail.com. Be accurate and clear, use short steps, and admit uncertainty.'
    }];
    for (const item of incoming) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
      const content = item.content.trim().slice(0, 1200);
      if (content) messages.push({ role: item.role, content });
    }
    if (!messages.some(m => m.role === 'user')) {
      return res.status(400).json({ error: 'Please enter a message first.' });
    }
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 450,
        temperature: 0.5
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('OpenAI request failed:', upstream.status);
      return res.status(502).json({ error: 'The AI service could not answer right now. Please try again shortly.' });
    }
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      return res.status(502).json({ error: 'The AI service returned an empty reply. Please try again.' });
    }
    return res.status(200).json({ reply: reply.trim() });
  } catch (error) {
    console.error('SizeItNow chat handler error:', error && error.message);
    return res.status(400).json({ error: 'I could not read that message. Please try again.' });
  }
};
