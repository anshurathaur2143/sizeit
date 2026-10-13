# SizeItNow AI assistant setup

The chat interface is committed and calls the serverless endpoint at `/api/chat`. The endpoint keeps the OpenAI API key on the server; do not put a key in `index.html` or any public client-side file.

## Enable the assistant on Vercel

1. Open the Vercel dashboard and select the SizeItNow project.
2. Open **Settings → Environment Variables**.
3. Add `OPENAI_API_KEY` and paste your OpenAI API key as the value.
4. Apply it to **Production** (and Preview if you want it enabled on preview deployments).
5. Save the setting, then open **Deployments** and redeploy the latest commit so the function receives the new variable.
6. Open the live site, click **Ask AI**, and ask a simple question such as “How do I compress an image to 50 KB?”

OpenAI API usage is billed separately from ChatGPT subscriptions and depends on the API account's billing and limits. Keep the key private. If the key is missing, the assistant shows a setup message instead of pretending it connected.

## What changed

- Colorful violet / cyan gradient palette, glassy navigation, richer cards, improved spacing, and mobile responsive layouts.
- Animated 3D torus-knot illustration in the hero with a CSS fallback if WebGL or the 3D library is unavailable.
- Floating AI help widget with starter prompts, conversation context, and friendly error states.
- Server-side OpenAI API call using `gpt-4o-mini`; the secret is read only from the Vercel environment.
- The existing image/PDF processing tools remain browser-side.
