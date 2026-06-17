import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocatorHealer } from '../healer.js'
import { ProviderRegistry } from '../providers/registry.js'
import type { AIProviderClient, CompletionResponse } from '../providers/types.js'
import type { SemanticElement } from '@anjartiyo/giogia-core'

function createMockClient(responseText: string): AIProviderClient {
  return {
    name: 'openai',
    isConfigured: () => true,
    complete: vi.fn().mockResolvedValue({
      content: responseText,
    } satisfies CompletionResponse),
  }
}

describe('LocatorHealer', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('heals broken locator with AI suggestion', async () => {
    const healingResponse = JSON.stringify({
      selector: '#new-login-btn',
      confidence: 0.92,
    })

    const mockClient = createMockClient(healingResponse)
    registry.register(mockClient)
    registry.setActive('openai')

    const healer = new LocatorHealer(registry)
    const result = await healer.heal(
      {
        id: 'login_button',
        role: 'button',
        name: 'Login',
        selector: '#old-login-btn',
        testId: null,
        xpath: null,
        attributes: { class: 'btn-primary' },
      } satisfies SemanticElement,
      '<html><body><button id="new-login-btn">Login</button></body></html>'
    )

    expect(result.elementId).toBe('login_button')
    expect(result.suggestedSelector).toBe('#new-login-btn')
    expect(result.confidence).toBe(0.92)
  })
})
