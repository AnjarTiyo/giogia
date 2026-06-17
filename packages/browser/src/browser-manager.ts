import { chromium, Browser, BrowserContext, Page } from 'playwright'

export interface BrowserSession {
  browser: Browser
  context: BrowserContext
  page: Page
}

export class BrowserManager {
  private session: BrowserSession | null = null

  async launch(headless = true): Promise<BrowserSession> {
    const browser = await chromium.launch({ headless })
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })
    const page = await context.newPage()
    this.session = { browser, context, page }
    return this.session
  }

  async navigate(url: string): Promise<void> {
    if (!this.session) throw new Error('Browser not launched. Call launch() first.')
    await this.session.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  getPage(): Page {
    if (!this.session) throw new Error('Browser not launched. Call launch() first.')
    return this.session.page
  }

  getSession(): BrowserSession {
    if (!this.session) throw new Error('Browser not launched. Call launch() first.')
    return this.session
  }

  async close(): Promise<void> {
    if (this.session) {
      await this.session.context.close()
      await this.session.browser.close()
      this.session = null
    }
  }

  /** Check if Playwright browsers are installed */
  static async isInstalled(): Promise<boolean> {
    try {
      const browser = await chromium.launch({ headless: true })
      await browser.close()
      return true
    } catch {
      return false
    }
  }
}
