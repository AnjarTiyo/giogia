import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderRegistry } from '../providers/registry.js'

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('registers built-in providers (openai, anthropic)', () => {
    const providers = registry.listProviders()
    expect(providers).toContain('openai')
    expect(providers).toContain('anthropic')
  })

  it('has openai as default active provider', () => {
    expect(registry.getActive()).toBe('openai')
  })

  it('throws when setting inactive provider without api key', () => {
    expect(() => registry.setActive('anthropic')).toThrow('not configured')
  })

  it('configure() sets api key and allows activation', () => {
    registry.configure('openai', 'sk-test-key')
    expect(() => registry.setActive('openai')).not.toThrow()
    expect(registry.getActive()).toBe('openai')
  })

  it('throws for unregistered provider', () => {
    expect(() => registry.setActive('ollama' as any)).toThrow('not registered')
  })

  it('setModel and getModel work correctly', () => {
    registry.setModel('openai', 'gpt-4o-mini')
    expect(registry.getModel()).toBe('gpt-4o-mini')
    expect(registry.getModel('openai')).toBe('gpt-4o-mini')
  })

  it('getClient returns active provider client after configure', () => {
    registry.configure('openai', 'sk-test')
    registry.setActive('openai')
    const client = registry.getClient()
    expect(client.name).toBe('openai')
    expect(client.isConfigured()).toBe(true)
  })
})
