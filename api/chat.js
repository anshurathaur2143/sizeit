// SizeItNow chat endpoint.
// Uses OpenAI when OPENAI_API_KEY is configured; otherwise provides useful built-in help.
// Never expose the API key to the browser.
function builtInReply(message) {
  const q = String(message || '').toLowerCase();
  if (/\b(50\s?kb|20\s?kb|100\s?kb|200\s?kb|compress|compression|target size|reduce size)\b/.test(q)) {
    return 'To compress an image: 1) Choose your image. 2) Select a target such as 50 KB or enter a custom size. 3) Choose Medium quality for a good balance, or High for more detail. 4) Select JPG, PNG or WebP and tap Compress Image. Very small targets can reduce clarity. Your image is processed in your browser.';
  }
  if (/\b(jpg|jpeg|png|webp|format|file type)\b/.test(q)) {
    return 'Choose JPG for photographs and generally smaller files; PNG for graphics, screenshots, or transparency; and WebP for a modern format that often gives a small file with good quality. If a website or form specifies a format, follow its requirement.';
  }
  if (/\b(pdf|convert|page|pages)\b/.test(q)) {
    return 'To convert PDF pages: open “Convert PDF pages to images”, choose your PDF, select PNG or JPG, choose the render quality, then convert. Each page appears separately with its own download button. To create a PDF instead, use “Combine multiple images into one PDF” and choose your images.';
  }
  if (/\b(quality|blurry|clear|resolution|pixel|dimension|frame|square|portrait|resize|crop)\b/.test(q)) {
    return 'For clearer results, start with High quality and keep the Original frame unless you need a specific shape. Square creates a 1:1 frame, Portrait creates a 4:5 frame, and Custom lets you set pixel dimensions. If the target KB is very small, you may need to lower quality or dimensions.';
  }
  if (/\b(upload|uploaded|choose image|select image|file name|not showing|not working|error|problem|issue|failed|stuck|download)\b/.test(q)) {
    return 'Try these steps: 1) Use a JPG, PNG or WebP image under 10 MB (PDF conversion accepts PDF files up to the tool’s displayed limit). 2) Refresh the page and select the file again. 3) Wait for the success message before starting the conversion. 4) If a download does not start, try another browser or check your downloads permissions. Your image tools run in the browser. For persistent issues, email iamanshuthakur@gmail.com.';
  }
  if (/\b(private|privacy|upload to server|safe|security|stored)\b/.test(q)) {
    return 'The image compression and PDF conversion tools are designed to process your selected files in your browser rather than upload them to a SizeItNow server. Please avoid entering passwords or other sensitive personal information in this chat.';
  }
  if (/\b(hello|hi|hey|help|what can you do|who are you)\b/.test(q)) {
    return 'Hi! I’m SizeItNow’s built-in helper. I can guide you through image compression, choosing JPG/PNG/WebP, image quality and frame sizes, creating PDFs, and converting PDF pages into separate images. Ask me what you’re trying to do and I’ll walk you through it.';
  }
  return 'I can help with SizeItNow’s image compressor and PDF tools. Ask me about compressing to a target KB, JPG vs PNG vs WebP, image quality or dimensions, combining images into a PDF, converting PDF pages into images, or troubleshooting an upload. For something I can’t resolve, email iamanshuthakur@gmail.com. This is the built-in helper; full conversational ChatGPT replies require the site owner to configure an OpenAI API key.';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST to send a message.' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const incoming = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const messages = [{
      role: 'system',
      content: 'You are SizeItNow AI, a friendly concise support assistant for a free browser-based image utility. Help users compress images to target KB sizes, choose JPG/PNG/WebP, select quality and frame sizes, combine images into a PDF, and convert PDF pages to individual image downloads. Do not claim to see or access users’ files. Do not ask for passwords or sensitive personal data. For unresolved issues direct users to iamanshuthakur@gmail.com. Be accurate, concise, and admit uncertainty.'
    }];
    for (const item of incoming) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
      const content = item.content.trim().slice(0, 1200);
      if (content) messages.push({ role: item.role, content });
    }
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return res.status(400).json({ error: 'Please enter a message first.' });

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(503).json({
        error: 'The AI backend is not configured yet. Add OPENAI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.'
      });
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 450, temperature: 0.5 })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('OpenAI request failed:', upstream.status, data && data.error && data.error.code);
      const code = data && data.error && data.error.code;
      let message = 'The AI service could not complete the request. Please try again in a moment.';
      if (upstream.status === 401 || upstream.status === 403) {
        message = 'The AI backend key is invalid or does not have permission. Check OPENAI_API_KEY in Vercel and redeploy.';
      } else if (upstream.status === 429 || code === 'insufficient_quota') {
        message = 'The AI backend is connected, but the OpenAI API account has reached its usage limit or needs billing enabled.';
      }
      return res.status(502).json({ error: message });
    }
    const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      return res.status(502).json({ error: 'The AI service returned an empty response. Please try again.' });
    }
    return res.status(200).json({ reply: reply.trim(), mode: 'openai' });
  } catch (error) {
    console.error('SizeItNow chat handler error:', error && error.message);
    return res.status(500).json({ error: 'The chat service encountered a server error. Please try again.' });
  }
};
