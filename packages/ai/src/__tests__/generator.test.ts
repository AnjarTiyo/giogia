import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestGenerator } from '../generator.js'
import { ProviderRegistry } from '../providers/registry.js'
import type { AIProviderClient, CompletionResponse } from '../providers/types.js'

function createMockClient(responseText: string): AIProviderClient {
  return {
    name: 'openai',
    isConfigured: () => true,
    complete: vi.fn().mockResolvedValue({
      content: responseText,
      usage: { promptTokens: 10, completionTokens: 20 },
    } satisfies CompletionResponse),
  }
}

describe('TestGenerator', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('fromNaturalLanguage generates DSL test code', async () => {
    const testCode = `
import { gio } from '@anjartiyo/giogia-runner'

describe('Login Flow', () => {
  it('should login as admin', async () => {
    await gio.navigate('/login')
    await gio.type('email_input', 'admin@test.com')
    await gio.click('login_button')
    await gio.expect('Dashboard').visible()
  })
})`.trim()

    const mockClient = createMockClient(testCode)
    registry.register(mockClient)
    registry.setActive('openai')

    const generator = new TestGenerator(registry)
    const result = await generator.fromNaturalLanguage('Login as admin, verify dashboard appears')

    expect(result.mode).toBe('semantic-dsl')
    expect(result.content).toContain('describe')
    expect(result.content).toContain('gio.navigate')
    expect(result.file).toContain('.spec.ts')
  })

  it('fromBDD generates test from Gherkin', async () => {
    const testCode = `
describe('Login Feature', () => {
  it('Successful Login', async () => {
    await gio.navigate('/login')
    await gio.type('email_input', 'admin')
    await gio.click('login_button')
    await gio.expect('Dashboard').visible()
  })
})`.trim()

    const mockClient = createMockClient(testCode)
    registry.register(mockClient)
    registry.setActive('openai')

    const generator = new TestGenerator(registry)
    const result = await generator.fromBDD({
      feature: 'Login',
      scenario: 'Successful Login',
      given: ['I am on login page'],
      when: ['I login as admin'],
      then: ['dashboard should be visible'],
    })

    expect(result.mode).toBe('bdd')
    expect(result.content).toContain('describe')
    expect(result.file).toContain('.spec.ts')
  })
})
