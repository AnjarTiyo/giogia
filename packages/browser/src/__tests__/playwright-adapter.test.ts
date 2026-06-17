import { describe, it, expect, afterEach } from 'vitest'
import { BrowserManager } from '../browser-manager.js'
import { PlaywrightAdapter } from '../playwright-adapter.js'

describe('PlaywrightAdapter', () => {
  let manager: BrowserManager
  let adapter: PlaywrightAdapter

  afterEach(async () => {
    await manager?.close()
  })

  it('captures snapshot from page with elements', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)

    await session.page.setContent(`
      <html>
        <body>
          <button id="login-btn" data-testid="login-button">Login</button>
          <input id="email" type="email" placeholder="Enter email" aria-label="Email input" />
          <a href="/forgot">Forgot Password</a>
        </body>
      </html>
    `)

    adapter = new PlaywrightAdapter(session.page)
    const snapshot = await adapter.captureSnapshot('https://test.example.com')

    expect(snapshot.url).toBe('https://test.example.com')
    expect(snapshot.elements.length).toBeGreaterThanOrEqual(3)

    const loginBtn = snapshot.elements.find(e => e.id === 'login-btn')
    expect(loginBtn).toBeDefined()
    expect(loginBtn!.role).toBe('button')
    expect(loginBtn!.name).toBe('Login')

    const email = snapshot.elements.find(e => e.id === 'email')
    expect(email).toBeDefined()
    expect(email!.role).toBe('textbox')
  })

  it('clickBySemanticId clicks element by id', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)

    await session.page.setContent(`
      <html>
        <body>
          <button id="my-btn" onclick="document.title='clicked'">Click Me</button>
        </body>
      </html>
    `)

    adapter = new PlaywrightAdapter(session.page)
    await adapter.clickBySemanticId('my-btn')

    const title = await session.page.title()
    expect(title).toBe('clicked')
  })

  it('clickBySemanticId throws for missing element', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.setContent(`<html><body></body></html>`)

    adapter = new PlaywrightAdapter(session.page)
    await expect(adapter.clickBySemanticId('nonexistent'))
      .rejects.toThrow('not found')
  })
})
