import type { AIProviderClient, CompletionRequest, CompletionResponse } from './types.js'

export class OpenAIProvider implements AIProviderClient {
  readonly name = 'openai' as const
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Run `gio ai login`.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const data = (await response.json()) as any
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    }
  }
}
