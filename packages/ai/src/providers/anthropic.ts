import type { AIProviderClient, CompletionRequest, CompletionResponse } from './types.js'

export class AnthropicProvider implements AIProviderClient {
  readonly name = 'anthropic' as const
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY ?? null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured. Run `gio ai login`.')
    }

    const systemMsg = req.messages.find(m => m.role === 'system')
    const messages = req.messages.filter(m => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: req.model,
        system: systemMsg?.content,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${error}`)
    }

    const data = (await response.json()) as any
    return {
      content: data.content[0].text,
      usage: data.usage,
    }
  }
}
