import { describe, it, expect } from 'vitest'
import { PageModelGenerator } from '../page-model.js'
import type { PageSnapshot } from '@giogia/core'

describe('PageModelGenerator', () => {
  const snapshot: PageSnapshot = {
    url: 'https://example.com/login',
    capturedAt: '2025-06-17T00:00:00Z',
    title: 'Login',
    elements: [
      { id: 'email_input', role: 'textbox', name: 'Email', selector: '#email', testId: null, xpath: null, attributes: {} },
      { id: 'password_input', role: 'textbox', name: 'Password', selector: '#password', testId: null, xpath: null, attributes: {} },
      { id: 'login_button', role: 'button', name: 'Login', selector: '#login-btn', testId: null, xpath: null, attributes: {} },
    ],
  }

  it('generates POM class name from URL', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.name).toBe('LoginPage')
  })

  it('generates elements with camelCase names', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.elements).toHaveLength(3)
    expect(model.elements[0].name).toBe('emailInput')
    expect(model.elements[1].name).toBe('passwordInput')
    expect(model.elements[2].name).toBe('loginButton')
  })

  it('generates valid TypeScript source', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.source).toContain('export class LoginPage')
    expect(model.source).toContain("gio.element('email_input')")
    expect(model.source).toContain("gio.element('login_button')")
  })
})
