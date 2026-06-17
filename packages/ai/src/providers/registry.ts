import type { AIProvider } from '@anjartiyo/giogia-core'
import type { AIProviderClient } from './types.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'

export class ProviderRegistry {
  private providers: Map<AIProvider, AIProviderClient> = new Map()
  private activeProvider: AIProvider = 'openai'
  private activeModels: Map<AIProvider, string> = new Map()

  constructor() {
    this.register(new OpenAIProvider())
    this.register(new AnthropicProvider())
  }

  register(client: AIProviderClient): void {
    this.providers.set(client.name, client)
  }

  setActive(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider "${provider}" not registered.`)
    }
    const client = this.providers.get(provider)!
    if (!client.isConfigured()) {
      throw new Error(`Provider "${provider}" not configured. Run \`gio ai login\`.`)
    }
    this.activeProvider = provider
  }

  getActive(): AIProvider {
    return this.activeProvider
  }

  getClient(): AIProviderClient {
    const client = this.providers.get(this.activeProvider)
    if (!client) {
      throw new Error('No active provider. Call setActive() first.')
    }
    return client
  }

  getClientByName(name: AIProvider): AIProviderClient | undefined {
    return this.providers.get(name)
  }

  setModel(provider: AIProvider, model: string): void {
    this.activeModels.set(provider, model)
  }

  getModel(provider?: AIProvider): string {
    const p = provider ?? this.activeProvider
    return this.activeModels.get(p) ?? 'gpt-4o'
  }

  listProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }

  configure(provider: AIProvider, apiKey: string): void {
    const client = this.providers.get(provider)
    if (!client) {
      throw new Error(`Provider "${provider}" not registered.`)
    }
    if (provider === 'openai') {
      this.register(new OpenAIProvider(apiKey))
    } else if (provider === 'anthropic') {
      this.register(new AnthropicProvider(apiKey))
    }
  }
}
