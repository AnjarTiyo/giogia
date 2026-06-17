# @anjartiyo/giogia-browser

Playwright browser adapter for GioGia. Browser lifecycle management and semantic page snapshot extraction.

## Usage

```ts
import { BrowserManager, PlaywrightAdapter } from '@anjartiyo/giogia-browser'

const manager = new BrowserManager()
const session = await manager.launch(true)
await manager.navigate('https://example.com')

const adapter = new PlaywrightAdapter(session.page)
const snapshot = await adapter.captureSnapshot('https://example.com')

console.log(snapshot.elements)
// [{ id: 'login_button', role: 'button', name: 'Login', ... }]

await manager.close()
```

## API

### BrowserManager
- `launch(headless?: boolean)` - Launch Chromium browser
- `navigate(url)` - Navigate to URL
- `getPage()` / `getSession()` - Get current page/session
- `close()` - Close browser
- `isInstalled()` - Check if Playwright browsers installed (static)

### PlaywrightAdapter
- `captureSnapshot(url)` - Extract all semantic elements from page
- `clickBySemanticId(id)` - Click element by semantic ID
- `getTitle()` / `getUrl()` - Page metadata

## Install

```bash
npm install @anjartiyo/giogia-browser
```
