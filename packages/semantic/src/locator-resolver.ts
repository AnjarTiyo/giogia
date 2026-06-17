import type { SemanticElement, LocatorStrategy, ResolveOptions } from '@anjartiyo/giogia-core'

const DEFAULT_STRATEGIES: LocatorStrategy[] = [
  'semantic-id',
  'label',
  'text',
  'role',
  'test-id',
  'css',
  'xpath',
]

export class LocatorResolver {
  constructor(private elements: SemanticElement[]) {}

  /**
   * Resolve a semantic identifier to a Playwright-compatible locator string.
   * Tries strategies in order until one yields a match.
   */
  resolve(semanticId: string, options?: ResolveOptions): string {
    const strategies = options?.strategies ?? DEFAULT_STRATEGIES

    for (const strategy of strategies) {
      const locator = this.tryStrategy(semanticId, strategy)
      if (locator) return locator
    }

    // Fallback: use semantic id as CSS id selector
    return `#${semanticId}`
  }

  private tryStrategy(semanticId: string, strategy: LocatorStrategy): string | null {
    switch (strategy) {
      case 'semantic-id': {
        const el = this.elements.find(e => e.id === semanticId)
        if (el?.selector) return el.selector
        if (el?.testId) return `[data-testid="${el.testId}"]`
        if (el) return `#${semanticId}`
        return null
      }
      case 'role': {
        const el = this.elements.find(e => e.role && e.name === semanticId)
        if (el) return `[role="${el.role}"][aria-label="${el.name}"]`
        return null
      }
      case 'label': {
        const el = this.elements.find(e => e.name === semanticId)
        if (el) return `[aria-label="${el.name}"]`
        return null
      }
      case 'text': {
        const el = this.elements.find(e => e.name === semanticId)
        if (el && el.role === 'button') return `button:has-text("${el.name}")`
        if (el) return `text="${el.name}"`
        return null
      }
      case 'test-id': {
        const el = this.elements.find(e => e.testId === semanticId) ||
          this.elements.find(e => e.id === semanticId && e.testId)
        if (el?.testId) return `[data-testid="${el.testId}"]`
        return null
      }
      case 'css': {
        const el = this.elements.find(e => e.selector === semanticId) ||
          this.elements.find(e => e.id === semanticId && e.selector)
        if (el?.selector) return el.selector
        return null
      }
      case 'xpath': {
        const el = this.elements.find(e => e.id === semanticId && e.xpath)
        if (el?.xpath) return el.xpath
        return null
      }
      default:
        return null
    }
  }

  /** Get all element IDs available */
  getAvailableIds(): string[] {
    return this.elements.map(e => e.id)
  }
}
