import type { Page } from 'playwright'
import { Assertions } from './assertions.js'

export class GioDSL {
  constructor(private page: Page) {}

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  async click(semanticId: string): Promise<void> {
    const selectors = [
      `#${semanticId}`,
      `[data-testid="${semanticId}"]`,
      `[aria-label="${semanticId}"]`,
    ]

    for (const sel of selectors) {
      const count = await this.page.locator(sel).count()
      if (count > 0) {
        await this.page.click(sel)
        return
      }
    }

    const textLocator = this.page.getByRole('button', { name: semanticId })
    if (await textLocator.count() > 0) {
      await textLocator.click()
      return
    }

    throw new Error(`Element "${semanticId}" not found on page`)
  }

  async type(semanticId: string, text: string): Promise<void> {
    const selectors = [
      `#${semanticId}`,
      `[data-testid="${semanticId}"]`,
      `[aria-label="${semanticId}"]`,
    ]

    for (const sel of selectors) {
      const count = await this.page.locator(sel).count()
      if (count > 0) {
        await this.page.fill(sel, text)
        return
      }
    }

    throw new Error(`Input "${semanticId}" not found on page`)
  }

  expect(target: string) {
    const assertions = new Assertions(this.page)
    return {
      visible: () => assertions.textVisible(target),
      hidden: () => assertions.textHidden(target),
      element: () => assertions.element(target),
    }
  }

  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms)
  }

  async raw<T>(fn: (ctx: { page: Page }) => Promise<T>): Promise<T> {
    return fn({ page: this.page })
  }

  getUrl(): string {
    return this.page.url()
  }

  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true })
  }
}
