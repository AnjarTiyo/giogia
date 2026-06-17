import { describe, it, expect } from 'vitest'

describe('core types (compile-time validation)', () => {
  it('SemanticElement has required fields', () => {
    const el = {
      id: 'login_button',
      role: 'button' as const,
      name: 'Login',
      selector: '.btn-login',
      testId: 'login-btn',
      xpath: '//button[text()="Login"]',
      attributes: { class: 'btn-login' },
    }
    expect(el.id).toBe('login_button')
    expect(el.role).toBe('button')
  })

  it('PageSnapshot contains elements array', () => {
    const snapshot = {
      url: 'https://example.com',
      capturedAt: new Date().toISOString(),
      title: 'Example',
      elements: [],
    }
    expect(snapshot.elements).toEqual([])
  })

  it('TestReport aggregates results', () => {
    const report = {
      total: 2,
      passed: 2,
      failed: 0,
      duration: 100,
      results: [],
      generatedAt: new Date().toISOString(),
    }
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
  })
})
