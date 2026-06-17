import { describe, it, expect } from 'vitest'
import { LocatorResolver } from '../locator-resolver.js'
import type { SemanticElement } from '@giogia/core'

const elements: SemanticElement[] = [
  {
    id: 'login_button',
    role: 'button',
    name: 'Login',
    selector: '#login-btn',
    testId: 'login-button',
    xpath: "//button[text()='Login']",
    attributes: { type: 'submit' },
  },
  {
    id: 'email_input',
    role: 'textbox',
    name: 'Email',
    selector: '#email',
    testId: 'email-input',
    xpath: '//input[@name="email"]',
    attributes: { type: 'email' },
  },
  {
    id: 'password_input',
    role: 'textbox',
    name: 'Password',
    selector: '#password',
    testId: null,
    xpath: '//input[@name="password"]',
    attributes: { type: 'password' },
  },
  {
    id: 'submit_btn_no_selector',
    role: 'button',
    name: 'Submit',
    selector: null,
    testId: 'submit-btn',
    xpath: null,
    attributes: {},
  },
]

describe('LocatorResolver', () => {
  it('resolves by semantic-id (CSS selector)', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('login_button')).toBe('#login-btn')
  })

  it('resolves by semantic-id with test-id fallback when no selector', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('submit_btn_no_selector')).toBe('[data-testid="submit-btn"]')
  })

  it('resolves by test-id strategy', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('login-button')).toBe('[data-testid="login-button"]')
  })

  it('resolves by label strategy when name matches', () => {
    const resolver = new LocatorResolver(elements)
    // Label strategy matches before role - login_button.name='Login'
    expect(resolver.resolve('Login')).toBe('[aria-label="Login"]')
  })

  it('resolves by label for input elements', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('Email')).toBe('[aria-label="Email"]')
  })

  it('falls back to #semanticId when no match', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('nonexistent_element')).toBe('#nonexistent_element')
  })

  it('returns available ids', () => {
    const resolver = new LocatorResolver(elements)
    const ids = resolver.getAvailableIds()
    expect(ids).toContain('login_button')
    expect(ids).toContain('email_input')
  })
})
