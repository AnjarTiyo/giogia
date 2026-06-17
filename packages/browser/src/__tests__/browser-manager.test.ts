import { describe, it, expect, afterEach } from 'vitest'
import { BrowserManager } from '../browser-manager.js'

describe('BrowserManager', () => {
  let manager: BrowserManager

  afterEach(async () => {
    await manager?.close()
  })

  it('launches browser and returns session', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    expect(session.browser).toBeDefined()
    expect(session.page).toBeDefined()
  })

  it('navigates to a URL', async () => {
    manager = new BrowserManager()
    await manager.launch(true)
    await manager.navigate('https://example.com')
    const url = manager.getPage().url()
    expect(url).toContain('example.com')
  })

  it('throws if navigate called before launch', async () => {
    manager = new BrowserManager()
    await expect(manager.navigate('https://example.com'))
      .rejects.toThrow('Browser not launched')
  })

  it('getPage returns the active page', async () => {
    manager = new BrowserManager()
    await manager.launch(true)
    const page = manager.getPage()
    expect(page).toBeDefined()
    await expect(page.title()).resolves.toBeDefined()
  })
})
