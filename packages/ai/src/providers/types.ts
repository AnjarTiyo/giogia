import type { AIProvider } from '@giogia/core'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export interface CompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface AIProviderClient {
  readonly name: AIProvider
  complete(req: CompletionRequest): Promise<CompletionResponse>
  isConfigured(): boolean
}
