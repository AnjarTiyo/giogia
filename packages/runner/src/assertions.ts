import type { Page } from 'playwright'

export interface AssertionBuilder {
  visible(): Promise<void>
  hidden(): Promise<void>
  enabled(): Promise<void>
  disabled(): Promise<void>
  hasText(text: string): Promise<void>
}

export class Assertions {
  constructor(private page: Page) {}

  element(selector: string): AssertionBuilder {
    return {
      visible: async () => {
        const locator = this.page.locator(selector)
        await locator.waitFor({ state: 'visible', timeout: 5000 })
      },
      hidden: async () => {
        const locator = this.page.locator(selector)
        await locator.waitFor({ state: 'hidden', timeout: 5000 })
      },
      enabled: async () => {
        const locator = this.page.locator(selector)
        const isEnabled = await locator.isEnabled()
        if (!isEnabled) throw new Error(`Expected "${selector}" to be enabled`)
      },
      disabled: async () => {
        const locator = this.page.locator(selector)
        const isDisabled = await locator.isDisabled()
        if (!isDisabled) throw new Error(`Expected "${selector}" to be disabled`)
      },
      hasText: async (text: string) => {
        const locator = this.page.locator(selector)
        await locator.waitFor({ state: 'visible', timeout: 5000 })
        const content = await locator.textContent()
        if (!content?.includes(text)) {
          throw new Error(`Expected "${selector}" to contain text "${text}", got "${content}"`)
        }
      },
    }
  }

  async textVisible(text: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first()
    await locator.waitFor({ state: 'visible', timeout: 5000 })
  }

  async textHidden(text: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first()
    await locator.waitFor({ state: 'hidden', timeout: 5000 })
  }

  async urlContains(expected: string): Promise<void> {
    const url = this.page.url()
    if (!url.includes(expected)) {
      throw new Error(`Expected URL to contain "${expected}", got "${url}"`)
    }
  }

  async titleEquals(expected: string): Promise<void> {
    const title = await this.page.title()
    if (title !== expected) {
      throw new Error(`Expected title "${expected}", got "${title}"`)
    }
  }
}
