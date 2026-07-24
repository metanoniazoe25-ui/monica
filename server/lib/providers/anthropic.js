import { anthropicTools, executeTool } from '../tools.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MAX_TOOL_ROUNDS = 4

export async function runAnthropicChat({ apiKey, model, system, messages }) {
  const trace = []
  const conversation = messages.map((m) => ({ role: m.role, content: m.content }))

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: conversation,
        tools: anthropicTools(),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const error = new Error(data?.error?.message || `Upstream error (${res.status})`)
      error.status = res.status
      throw error
    }

    const toolUses = (data.content || []).filter((b) => b.type === 'tool_use')
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    if (data.stop_reason !== 'tool_use' || toolUses.length === 0) {
      return { content: text, trace }
    }

    conversation.push({ role: 'assistant', content: data.content })

    const toolResults = []
    for (const use of toolUses) {
      let result
      try {
        result = await executeTool(use.name, use.input || {})
        trace.push({ tool: use.name, input: use.input, ok: true })
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) }
        trace.push({ tool: use.name, input: use.input, ok: false, error: result.error })
      }
      toolResults.push({ type: 'tool_result', tool_use_id: use.id, content: JSON.stringify(result) })
    }
    conversation.push({ role: 'user', content: toolResults })
  }

  return {
    content: "I hit my tool-use limit for this turn — try rephrasing or breaking the request into steps.",
    trace,
  }
}
