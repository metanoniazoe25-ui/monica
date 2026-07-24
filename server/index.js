import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const PORT = process.env.PORT || 8787
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT = `You are M.O.N.I.C.A., a calm, capable AI assistant inspired by J.A.R.V.I.S.
Speak concisely and directly. You may use light, dry wit, but never at the expense of
clarity. Prefer short paragraphs or tight lists over long prose. If you don't know
something or can't verify it, say so plainly rather than guessing.`

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function resolveApiKey(req) {
  const headerKey = req.get('x-api-key')
  if (headerKey && headerKey.trim()) return headerKey.trim()
  return process.env.ANTHROPIC_API_KEY || ''
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    hasServerKey: Boolean(process.env.ANTHROPIC_API_KEY),
    model: DEFAULT_MODEL,
  })
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {}

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  const apiKey = resolveApiKey(req)

  if (!apiKey) {
    return res.status(200).json({
      demo: true,
      content:
        "I don't have an Anthropic API key configured yet, so I can't think for real. " +
        'Add one in Settings (top right) or set ANTHROPIC_API_KEY on the server, and I’ll be fully online.',
    })
  }

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      const message = data?.error?.message || `Upstream error (${upstream.status})`
      return res.status(upstream.status).json({ error: message })
    }

    const content = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    res.json({ content, usage: data.usage || null })
  } catch (err) {
    console.error('chat proxy error', err)
    res.status(502).json({ error: 'Failed to reach the Anthropic API' })
  }
})

app.listen(PORT, () => {
  console.log(`M.O.N.I.C.A. server listening on http://localhost:${PORT}`)
})
