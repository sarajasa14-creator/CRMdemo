/* Shared AI call for bot.mjs and ideas.mjs. The provider is chosen with environment variables in Netlify:
   LLM_PROVIDER = anthropic (default) | gemini
   anthropic: ANTHROPIC_API_KEY, optional BOT_MODEL (default claude-haiku-5-5)
   gemini:    GEMINI_API_KEY,    optional GEMINI_MODEL (default gemini-2.5-flash)
   Switching provider: change LLM_PROVIDER, then Deploys -> Trigger deploy. No code changes needed. */

const PROVIDER = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase() === 'gemini' ? 'gemini' : 'anthropic';

export const llmConfigured = () =>
  PROVIDER === 'gemini' ? !!process.env.GEMINI_API_KEY : !!process.env.ANTHROPIC_API_KEY;

/* messages: [{ role: 'user' | 'assistant', content: string }]. Returns the reply text, or throws Error with .status set. */
export async function callLLM({ system, messages, maxTokens, timeoutMs }) {
  let r;
  if (PROVIDER === 'gemini') {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const generationConfig = { maxOutputTokens: maxTokens, temperature: 0.4 };
    if (/flash/i.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 }; // thinking tokens would eat the answer budget
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } else {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.BOT_MODEL || 'claude-haiku-5-5', max_tokens: maxTokens, system, messages }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  }
  if (!r.ok) {
    let detail = '';
    try { detail = (await r.text()).slice(0, 300); } catch {}
    console.error('LLM error', PROVIDER, r.status, detail);   // visible in Netlify -> Logs -> Functions
    const e = new Error('upstream'); e.status = r.status; throw e;
  }
  const j = await r.json();
  if (PROVIDER === 'gemini') {
    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    return parts.map(p => p.text || '').join('\n').trim();
  }
  return ((j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')).trim();
}
