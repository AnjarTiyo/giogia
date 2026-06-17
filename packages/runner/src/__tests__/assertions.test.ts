import { describe, it, expect, afterEach } from 'vitest'
import { BrowserManager } from '@anjartiyo/giogia-browser'
import { Assertions } from '../assertions.js'

describe('Assertions', () => {
  let manager: BrowserManager

  afterEach(async () => {
    await manager?.close()
  })

  it('textVisible passes when text is on page', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.setContent('<html><body><h1>Hello World</h1></body></html>')

    const assertions = new Assertions(session.page)
    await expect(assertions.textVisible('Hello World')).resolves.toBeUndefined()
  })

  it('textVisible throws when text missing', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.setContent('<html><body><h1>Different</h1></body></html>')

    const assertions = new Assertions(session.page)
    await expect(assertions.textVisible('Hello World')).rejects.toThrow()
  }, 10000)

  it('urlContains passes for matching URL', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.goto('https://example.com/login')

    const assertions = new Assertions(session.page)
    await expect(assertions.urlContains('login')).resolves.toBeUndefined()
  })

  it('urlContains throws for non-matching URL', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.goto('https://example.com/login')

    const assertions = new Assertions(session.page)
    await expect(assertions.urlContains('dashboard')).rejects.toThrow()
  })

  it('element().visible passes when element visible', async () => {
    manager = new BrowserManager()
    const session = await manager.launch(true)
    await session.page.setContent('<html><body><button id="btn">Click</button></body></html>')

    const assertions = new Assertions(session.page)
    await expect(assertions.element('#btn').visible()).resolves.toBeUndefined()
  })
})
