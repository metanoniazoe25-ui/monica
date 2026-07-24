import { ollamaTools, executeTool } from '../tools.js'

const MAX_TOOL_ROUNDS = 4

export async function runOllamaChat({ baseUrl, model, system, messages }) {
  const trace = []
  const url = baseUrl.replace(/\/$/, '')
  const conversation = [{ role: 'system', content: system }, ...messages.map((m) => ({ role: m.role, content: m.content }))]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: conversation, tools: ollamaTools(), stream: false }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const error = new Error(text || `Ollama returned ${res.status}`)
      error.status = res.status < 500 ? res.status : 502
      throw error
    }

    const data = await res.json()
    const message = data.message || {}
    const toolCalls = message.tool_calls || []

    if (toolCalls.length === 0) {
      return { content: (message.content || '').trim(), trace }
    }

    conversation.push({ role: 'assistant', content: message.content || '', tool_calls: toolCalls })

    for (const call of toolCalls) {
      const name = call.function?.name
      let args = call.function?.arguments
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args)
        } catch {
          args = {}
        }
      }
      let result
      try {
        result = await executeTool(name, args || {})
        trace.push({ tool: name, input: args, ok: true })
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) }
        trace.push({ tool: name, input: args, ok: false, error: result.error })
      }
      conversation.push({ role: 'tool', content: JSON.stringify(result) })
    }
  }

  return {
    content: "I hit my tool-use limit for this turn — try rephrasing or breaking the request into steps.",
    trace,
  }
}
