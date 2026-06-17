import { Page } from 'playwright'
import type { SemanticElement, PageSnapshot } from '@giogia/core'

export class PlaywrightAdapter {
  constructor(private page: Page) {}

  /** Extract all semantic elements from current page */
  async captureSnapshot(url: string): Promise<PageSnapshot> {
    const elements: SemanticElement[] = await this.page.evaluate(() => {
      const interactiveSelectors = [
        'button', 'a', 'input', 'select', 'textarea',
        '[role]', '[data-testid]', '[aria-label]',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      ]

      const results: SemanticElement[] = []
      const seen = new Set<string>()

      for (const sel of interactiveSelectors) {
        document.querySelectorAll(sel).forEach((el) => {
          const tag = el.tagName.toLowerCase()
          const role = el.getAttribute('role') || inferRole(tag, el as HTMLElement)
          const name = el.getAttribute('aria-label') ||
            (el as HTMLElement).innerText?.trim().slice(0, 80) ||
            (el as HTMLInputElement).placeholder ||
            el.getAttribute('name') ||
            el.id ||
            ''
          const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id')
          const id = el.id || `${role}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${results.length}`

          if (seen.has(id)) return
          seen.add(id)

          results.push({
            id: id.slice(0, 128),
            role: role as SemanticElement['role'],
            name: name.slice(0, 128),
            selector: buildSelector(el),
            testId,
            xpath: buildXPath(el),
            attributes: getAttributes(el),
          })
        })
      }

      return results

      function inferRole(tag: string, el: HTMLElement): string {
        const type = (el as HTMLInputElement).type
        if (tag === 'button' || type === 'submit' || type === 'button') return 'button'
        if (tag === 'a') return 'link'
        if (tag === 'input' && (type === 'text' || type === 'email' || type === 'password')) return 'textbox'
        if (tag === 'input' && type === 'checkbox') return 'checkbox'
        if (tag === 'input' && type === 'radio') return 'radio'
        if (tag === 'select' || tag === 'combobox') return 'combobox'
        if (tag === 'textarea') return 'textbox'
        if (tag === 'img') return 'image'
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading'
        return 'generic'
      }

      function buildSelector(el: Element): string | null {
        if (el.id) return `#${CSS.escape(el.id)}`
        const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id')
        if (testId) return `[data-testid="${testId}"]`
        return null
      }

      function buildXPath(el: Element): string | null {
        if (el.id) return `//*[@id="${el.id}"]`
        const text = (el as HTMLElement).innerText?.trim().slice(0, 50)
        if (text) return `//${el.tagName.toLowerCase()}[contains(text(),'${text}')]`
        return null
      }

      function getAttributes(el: Element): Record<string, string> {
        const attrs: Record<string, string> = {}
        for (const attr of el.attributes) {
          if (!['class', 'style'].includes(attr.name)) {
            attrs[attr.name] = attr.value
          }
        }
        return attrs
      }
    })

    return {
      url,
      capturedAt: new Date().toISOString(),
      title: await this.page.title(),
      elements,
    }
  }

  /** Get page title */
  async getTitle(): Promise<string> {
    return this.page.title()
  }

  /** Get current URL */
  getUrl(): string {
    return this.page.url()
  }

  /** Click element by semantic id (resolved via page evaluation) */
  async clickBySemanticId(id: string): Promise<void> {
    const found = await this.page.evaluate((targetId) => {
      const el = document.getElementById(targetId) ||
        document.querySelector(`[data-testid="${targetId}"]`) ||
        document.querySelector(`[aria-label="${targetId}"]`)
      return !!el
    }, id)

    if (found) {
      await this.page.click(`#${id}`)
    } else {
      throw new Error(`Semantic element "${id}" not found on page`)
    }
  }
}
