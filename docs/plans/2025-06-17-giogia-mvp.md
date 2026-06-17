# GioGia MVP Implementation Plan

> **REQUIRED SUB-SKILL:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Build GioGia - an AI-powered web testing platform with semantic locators, AI-assisted test generation, deterministic execution, BDD support, and a unified CLI (`gio`).

**Architecture:** Monorepo with 5 packages layered bottom-up: `browser` (Playwright adapter), `semantic` (snapshots/locators/POM), `ai` (provider abstraction/explore/generate/heal), `runner` (execution/assertions/reporting), `cli` (commander-based CLI). Each package exposes typed interfaces consumed by the layer above. AI used only for authoring/discovery; execution is deterministic.

**Tech Stack:** TypeScript (strict), pnpm workspaces, Vitest (unit), Playwright (browser), Commander.js (CLI), tsup (bundling), Vercel AI SDK (multi-provider AI abstraction).

---

## Task 0: Project Scaffolding

**Files:**
- Modify: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `vitest.workspace.ts`
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/tsup.config.ts`

**Step 1: Write workspace config**

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**Step 2: Write base tsconfig**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

**Step 3: Update root package.json for pnpm workspace scripts**

```json
{
  "name": "giogia",
  "version": "0.1.0",
  "private": true,
  "description": "AI-first web test automation framework",
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --noEmit",
    "clean": "pnpm -r clean"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "tsup": "^8.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 4: Write vitest workspace config**

```ts
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/*'
])
```

**Step 5: Write .gitignore**

```gitignore
node_modules/
dist/
.gio/
reports/
*.tsbuildinfo
.env
.env.local
```

**Step 6: Populate packages/cli/package.json**

```json
{
  "name": "@giogia/cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "gio": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "commander": "^13.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 7: Populate packages/cli/tsup.config.ts**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

**Step 8: Validate scaffold**

Run: `pnpm install`
Expected: Installs all dependencies, sets up workspace symlinks.

Run: `pnpm -r build`
Expected: CLI package builds to `packages/cli/dist/index.js` (empty stub).

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold monorepo with pnpm workspaces, tsconfig, vitest"
```

---

## Task 1: Core Types Package

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/tsup.config.ts`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/__tests__/types.test.ts`

**Step 1: Scaffold core package**

```json
// packages/core/package.json
{
  "name": "@giogia/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

```ts
// packages/core/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
})
```

**Step 2: Define core types**

```ts
// packages/core/src/types.ts

/** Unique semantic identifier for a page element */
export type SemanticId = string

/** Roles an element can play (ARIA-inspired) */
export type ElementRole =
  | 'button'
  | 'link'
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'combobox'
  | 'heading'
  | 'image'
  | 'list'
  | 'listitem'
  | 'navigation'
  | 'dialog'
  | 'alert'
  | 'generic'

/** A semantic snapshot entry describing one interactive element */
export interface SemanticElement {
  /** Stable semantic ID (e.g., "login_button") */
  id: SemanticId
  /** ARIA / inferred role */
  role: ElementRole
  /** Visible text or aria-label */
  name: string
  /** CSS selector (fallback) */
  selector: string | null
  /** test-id attribute (fallback) */
  testId: string | null
  /** XPath (last resort fallback) */
  xpath: string | null
  /** Additional metadata */
  attributes: Record<string, string>
}

/** Full page snapshot */
export interface PageSnapshot {
  /** Source URL */
  url: string
  /** Capture timestamp */
  capturedAt: string
  /** Page title */
  title: string
  /** All semantic elements found */
  elements: SemanticElement[]
}

/** Locator resolution strategy ordered by priority */
export type LocatorStrategy =
  | 'semantic-id'
  | 'role'
  | 'label'
  | 'text'
  | 'test-id'
  | 'css'
  | 'xpath'

/** Options for resolving a semantic locator */
export interface ResolveOptions {
  /** Override resolution strategy order */
  strategies?: LocatorStrategy[]
  /** Timeout in ms */
  timeout?: number
}

/** AI provider identifier */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'ollama'

/** AI model configuration */
export interface AIModelConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseURL?: string
}

/** Single discovered workflow from exploratory testing */
export interface DiscoveredFlow {
  name: string
  steps: string[]
  url: string
}

/** Exploratory test report */
export interface ExploratoryReport {
  url: string
  exploredAt: string
  flows: DiscoveredFlow[]
  potentialIssues: string[]
  suggestedTests: string[]
}

/** BDD scenario parsed from Gherkin */
export interface BDDScenario {
  feature: string
  scenario: string
  given: string[]
  when: string[]
  then: string[]
}

/** Supported test authoring modes */
export type TestMode = 'natural-language' | 'bdd' | 'semantic-dsl' | 'manual-code'

/** Single generated test */
export interface GeneratedTest {
  name: string
  file: string
  content: string
  mode: TestMode
}

/** Test execution result */
export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  screenshot?: string
  trace?: string
  video?: string
}

/** Full test run report */
export interface TestReport {
  total: number
  passed: number
  failed: number
  duration: number
  results: TestResult[]
  generatedAt: string
}
```

```ts
// packages/core/src/index.ts
export * from './types.js'
```

**Step 3: Write type validation test (compile-time + runtime sanity)**

```ts
// packages/core/src/__tests__/types.test.ts
import { describe, it, expect } from 'vitest'

describe('core types (compile-time validation)', () => {
  it('SemanticElement has required fields', () => {
    const el = {
      id: 'login_button',
      role: 'button' as const,
      name: 'Login',
      selector: '.btn-login',
      testId: 'login-btn',
      xpath: '//button[text()="Login"]',
      attributes: { class: 'btn-login' },
    }
    expect(el.id).toBe('login_button')
    expect(el.role).toBe('button')
  })

  it('PageSnapshot contains elements array', () => {
    const snapshot = {
      url: 'https://example.com',
      capturedAt: new Date().toISOString(),
      title: 'Example',
      elements: [],
    }
    expect(snapshot.elements).toEqual([])
  })

  it('TestReport aggregates results', () => {
    const report = {
      total: 2,
      passed: 2,
      failed: 0,
      duration: 100,
      results: [],
      generatedAt: new Date().toISOString(),
    }
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
  })
})
```

**Step 4: Run tests to verify types compile and pass**

Run: `pnpm --filter @giogia/core test`
Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat(core): define core types for semantic elements, snapshots, AI, tests"
```

---

## Task 2: Browser Layer (Playwright Adapter)

**Files:**
- Create: `packages/browser/package.json`
- Create: `packages/browser/tsconfig.json`
- Create: `packages/browser/tsup.config.ts`
- Create: `packages/browser/src/index.ts`
- Create: `packages/browser/src/playwright-adapter.ts`
- Create: `packages/browser/src/browser-manager.ts`
- Create: `packages/browser/src/__tests__/browser-manager.test.ts`
- Create: `packages/browser/src/__tests__/playwright-adapter.test.ts`

**Step 1: Scaffold browser package**

```json
// packages/browser/package.json
{
  "name": "@giogia/browser",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "@giogia/core": "workspace:*",
    "playwright": "^1.52.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

Same tsconfig.json and tsup.config.ts pattern as core package.

**Step 2: Write BrowserManager - handles lifecycle**

```ts
// packages/browser/src/browser-manager.ts
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
      // chromium.launch will fail with helpful message if not installed
      const browser = await chromium.launch({ headless: true })
      await browser.close()
      return true
    } catch {
      return false
    }
  }
}
```

**Step 3: Write PlaywrightAdapter - wraps Page with semantic helpers**

```ts
// packages/browser/src/playwright-adapter.ts
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
```

**Step 4: Write browser-manager test**

```ts
// packages/browser/src/__tests__/browser-manager.test.ts
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
```

**Step 5: Write playwright-adapter test**

```ts
// packages/browser/src/__tests__/playwright-adapter.test.ts
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

    // Navigate to a page with known elements
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
```

**Step 6: Write barrel export**

```ts
// packages/browser/src/index.ts
export { BrowserManager } from './browser-manager.js'
export type { BrowserSession } from './browser-manager.js'
export { PlaywrightAdapter } from './playwright-adapter.js'
```

**Step 7: Run tests**

Run: `pnpm --filter @giogia/browser test`
Expected: 7 tests PASS (4 for BrowserManager, 3 for PlaywrightAdapter).

**Step 8: Commit**

```bash
git add packages/browser/
git commit -m "feat(browser): add Playwright adapter with snapshot capture and semantic clicks"
```

---

## Task 3: Semantic Layer (Snapshot Store, Locator Resolution, POM)

**Files:**
- Create: `packages/semantic/package.json`
- Create: `packages/semantic/tsconfig.json`
- Create: `packages/semantic/tsup.config.ts`
- Create: `packages/semantic/src/index.ts`
- Create: `packages/semantic/src/snapshot-store.ts`
- Create: `packages/semantic/src/locator-resolver.ts`
- Create: `packages/semantic/src/page-model.ts`
- Create: `packages/semantic/src/__tests__/snapshot-store.test.ts`
- Create: `packages/semantic/src/__tests__/locator-resolver.test.ts`
- Create: `packages/semantic/src/__tests__/page-model.test.ts`

**Step 1: Scaffold semantic package**

```json
// packages/semantic/package.json
{
  "name": "@giogia/semantic",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "@giogia/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Write SnapshotStore**

```ts
// packages/semantic/src/snapshot-store.ts
import type { PageSnapshot, SemanticElement } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export class SnapshotStore {
  private snapshots: Map<string, PageSnapshot> = new Map()

  /** Load snapshot from disk (.gio/snapshot.json) */
  async load(filePath: string): Promise<PageSnapshot> {
    const raw = await fs.readFile(filePath, 'utf-8')
    const snapshot: PageSnapshot = JSON.parse(raw)
    this.snapshots.set(snapshot.url, snapshot)
    return snapshot
  }

  /** Save snapshot to disk */
  async save(snapshot: PageSnapshot, dir = '.gio'): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, 'snapshot.json')
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2))
    this.snapshots.set(snapshot.url, snapshot)
  }

  /** Get loaded snapshot by URL */
  get(url: string): PageSnapshot | undefined {
    return this.snapshots.get(url)
  }

  /** Find element by semantic id across all loaded snapshots */
  findElement(id: string): SemanticElement | undefined {
    for (const snapshot of this.snapshots.values()) {
      const el = snapshot.elements.find(e => e.id === id)
      if (el) return el
    }
    return undefined
  }

  /** List all URLs with loaded snapshots */
  listUrls(): string[] {
    return Array.from(this.snapshots.keys())
  }

  clear(): void {
    this.snapshots.clear()
  }
}
```

**Step 3: Write LocatorResolver**

```ts
// packages/semantic/src/locator-resolver.ts
import type { SemanticElement, LocatorStrategy, ResolveOptions } from '@giogia/core'

const DEFAULT_STRATEGIES: LocatorStrategy[] = [
  'semantic-id',
  'role',
  'label',
  'text',
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
```

**Step 4: Write PageModel generator**

```ts
// packages/semantic/src/page-model.ts
import type { PageSnapshot, SemanticElement } from '@giogia/core'

export interface PageModelClass {
  name: string
  elements: PageModelElement[]
  source: string
}

export interface PageModelElement {
  name: string
  semanticId: string
  role: string
  type: string
}

export class PageModelGenerator {
  /**
   * Generate a TypeScript Page Object Model class from a snapshot
   */
  generate(snapshot: PageSnapshot): PageModelClass {
    const name = this.toPascalCase(this.urlToName(snapshot.url)) + 'Page'
    const elements = snapshot.elements.map(el => ({
      name: this.toCamelCase(el.id),
      semanticId: el.id,
      role: el.role,
      type: this.elementType(el),
    }))

    const source = this.buildClassSource(name, elements)

    return { name, elements, source }
  }

  private buildClassSource(className: string, elements: PageModelElement[]): string {
    const lines: string[] = [
      `import { gio } from '@giogia/semantic'`,
      '',
      `export class ${className} {`,
    ]

    for (const el of elements) {
      const escapedId = el.semanticId.replace(/'/g, "\\'")
      lines.push(`  ${el.name} = gio.element('${escapedId}')`)
    }

    lines.push('}')
    lines.push('')
    return lines.join('\n')
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[^a-zA-Z0-9]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private urlToName(url: string): string {
    try {
      const { hostname, pathname } = new URL(url)
      const parts = pathname.split('/').filter(Boolean)
      return parts[parts.length - 1] || hostname.replace(/\./g, '_')
    } catch {
      return 'Page'
    }
  }

  private elementType(el: SemanticElement): string {
    if (el.role === 'button') return 'ButtonElement'
    if (el.role === 'textbox') return 'InputElement'
    if (el.role === 'checkbox') return 'CheckboxElement'
    if (el.role === 'link') return 'LinkElement'
    return 'Element'
  }
}
```

**Step 5: Write snapshot-store test**

```ts
// packages/semantic/src/__tests__/snapshot-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SnapshotStore } from '../snapshot-store.js'
import type { PageSnapshot } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('SnapshotStore', () => {
  let store: SnapshotStore
  let tmpDir: string

  const sampleSnapshot: PageSnapshot = {
    url: 'https://example.com/login',
    capturedAt: '2025-06-17T00:00:00Z',
    title: 'Login Page',
    elements: [
      { id: 'email_input', role: 'textbox', name: 'Email', selector: '#email', testId: null, xpath: null, attributes: {} },
      { id: 'password_input', role: 'textbox', name: 'Password', selector: '#password', testId: null, xpath: null, attributes: {} },
      { id: 'login_button', role: 'button', name: 'Login', selector: '#login-btn', testId: 'login-button', xpath: null, attributes: {} },
    ],
  }

  beforeEach(async () => {
    store = new SnapshotStore()
    tmpDir = path.join(os.tmpdir(), `giogia-test-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })
  })

  it('saves and loads snapshot to/from disk', async () => {
    await store.save(sampleSnapshot, tmpDir)

    const filePath = path.join(tmpDir, 'snapshot.json')
    const exists = await fs.stat(filePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    const loaded = await store.load(filePath)
    expect(loaded.url).toBe('https://example.com/login')
    expect(loaded.elements).toHaveLength(3)
  })

  it('get returns snapshot by URL after load', async () => {
    store = new SnapshotStore()
    // add directly
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    const found = store.get('https://example.com/login')
    expect(found).toBeDefined()
    expect(found!.title).toBe('Login Page')
  })

  it('findElement locates element by semantic id', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    const el = store.findElement('login_button')
    expect(el).toBeDefined()
    expect(el!.role).toBe('button')
    expect(el!.name).toBe('Login')
  })

  it('findElement returns undefined for missing id', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    expect(store.findElement('nonexistent')).toBeUndefined()
  })

  it('listUrls returns all loaded snapshot URLs', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    expect(store.listUrls()).toContain('https://example.com/login')
  })
})
```

**Step 6: Write locator-resolver test**

```ts
// packages/semantic/src/__tests__/locator-resolver.test.ts
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

  it('resolves by text strategy for buttons', () => {
    const resolver = new LocatorResolver(elements)
    expect(resolver.resolve('Login')).toBe('button:has-text("Login")')
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
```

**Step 7: Write page-model test**

```ts
// packages/semantic/src/__tests__/page-model.test.ts
import { describe, it, expect } from 'vitest'
import { PageModelGenerator } from '../page-model.js'
import type { PageSnapshot } from '@giogia/core'

describe('PageModelGenerator', () => {
  const snapshot: PageSnapshot = {
    url: 'https://example.com/login',
    capturedAt: '2025-06-17T00:00:00Z',
    title: 'Login',
    elements: [
      { id: 'email_input', role: 'textbox', name: 'Email', selector: '#email', testId: null, xpath: null, attributes: {} },
      { id: 'password_input', role: 'textbox', name: 'Password', selector: '#password', testId: null, xpath: null, attributes: {} },
      { id: 'login_button', role: 'button', name: 'Login', selector: '#login-btn', testId: null, xpath: null, attributes: {} },
    ],
  }

  it('generates POM class name from URL', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.name).toBe('LoginPage')
  })

  it('generates elements with camelCase names', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.elements).toHaveLength(3)
    expect(model.elements[0].name).toBe('emailInput')
    expect(model.elements[1].name).toBe('passwordInput')
    expect(model.elements[2].name).toBe('loginButton')
  })

  it('generates valid TypeScript source', () => {
    const gen = new PageModelGenerator()
    const model = gen.generate(snapshot)
    expect(model.source).toContain('export class LoginPage')
    expect(model.source).toContain("gio.element('email_input')")
    expect(model.source).toContain("gio.element('login_button')")
  })
})
```

**Step 8: Write barrel export**

```ts
// packages/semantic/src/index.ts
export { SnapshotStore } from './snapshot-store.js'
export { LocatorResolver } from './locator-resolver.js'
export { PageModelGenerator } from './page-model.js'
export type { PageModelClass, PageModelElement } from './page-model.js'
```

**Step 9: Run tests**

Run: `pnpm --filter @giogia/semantic test`
Expected: All tests PASS (5 snapshot-store + 6 locator-resolver + 3 page-model = 14 total).

**Step 10: Commit**

```bash
git add packages/semantic/
git commit -m "feat(semantic): add snapshot store, locator resolver, and POM generator"
```

---

## Task 4: AI Layer (Provider Abstraction, Explore, Generate, Locator Healing)

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/tsconfig.json`
- Create: `packages/ai/tsup.config.ts`
- Create: `packages/ai/src/index.ts`
- Create: `packages/ai/src/providers/types.ts`
- Create: `packages/ai/src/providers/openai.ts`
- Create: `packages/ai/src/providers/anthropic.ts`
- Create: `packages/ai/src/providers/registry.ts`
- Create: `packages/ai/src/explorer.ts`
- Create: `packages/ai/src/generator.ts`
- Create: `packages/ai/src/healer.ts`
- Create: `packages/ai/src/__tests__/registry.test.ts`
- Create: `packages/ai/src/__tests__/generator.test.ts`
- Create: `packages/ai/src/__tests__/healer.test.ts`

**Step 1: Scaffold AI package**

```json
// packages/ai/package.json
{
  "name": "@giogia/ai",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "@giogia/core": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Write provider abstraction types**

```ts
// packages/ai/src/providers/types.ts
import type { AIProvider } from '@giogia/core'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export interface CompletionResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface AIProviderClient {
  readonly name: AIProvider
  complete(req: CompletionRequest): Promise<CompletionResponse>
  isConfigured(): boolean
}
```

**Step 3: Write OpenAI provider (with mock-compatible interface)**

```ts
// packages/ai/src/providers/openai.ts
import type { AIProviderClient, CompletionRequest, CompletionResponse } from './types.js'

export class OpenAIProvider implements AIProviderClient {
  readonly name = 'openai' as const
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Run `gio ai login`.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.maxTokens ?? 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const data = (await response.json()) as any
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    }
  }
}
```

**Step 4: Write Anthropic provider**

```ts
// packages/ai/src/providers/anthropic.ts
import type { AIProviderClient, CompletionRequest, CompletionResponse } from './types.js'

export class AnthropicProvider implements AIProviderClient {
  readonly name = 'anthropic' as const
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY ?? null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured. Run `gio ai login`.')
    }

    // Extract system message
    const systemMsg = req.messages.find(m => m.role === 'system')
    const messages = req.messages.filter(m => m.role !== 'system')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: req.model,
        system: systemMsg?.content,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${error}`)
    }

    const data = (await response.json()) as any
    return {
      content: data.content[0].text,
      usage: data.usage,
    }
  }
}
```

**Step 5: Write provider registry**

```ts
// packages/ai/src/providers/registry.ts
import type { AIProvider } from '@giogia/core'
import type { AIProviderClient } from './types.js'
import { OpenAIProvider } from './openai.js'
import { AnthropicProvider } from './anthropic.js'

export class ProviderRegistry {
  private providers: Map<AIProvider, AIProviderClient> = new Map()
  private activeProvider: AIProvider = 'openai'
  private activeModels: Map<AIProvider, string> = new Map()

  constructor() {
    // Register built-in providers
    this.register(new OpenAIProvider())
    this.register(new AnthropicProvider())
  }

  register(client: AIProviderClient): void {
    this.providers.set(client.name, client)
  }

  setActive(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider "${provider}" not registered.`)
    }
    const client = this.providers.get(provider)!
    if (!client.isConfigured()) {
      throw new Error(`Provider "${provider}" not configured. Run \`gio ai login\`.`)
    }
    this.activeProvider = provider
  }

  getActive(): AIProvider {
    return this.activeProvider
  }

  getClient(): AIProviderClient {
    const client = this.providers.get(this.activeProvider)
    if (!client) {
      throw new Error(`No active provider. Call setActive() first.`)
    }
    return client
  }

  getClientByName(name: AIProvider): AIProviderClient | undefined {
    return this.providers.get(name)
  }

  setModel(provider: AIProvider, model: string): void {
    this.activeModels.set(provider, model)
  }

  getModel(provider?: AIProvider): string {
    const p = provider ?? this.activeProvider
    return this.activeModels.get(p) ?? 'gpt-4o'
  }

  listProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }

  /** Apply API key to a provider */
  configure(provider: AIProvider, apiKey: string): void {
    const client = this.providers.get(provider)
    if (!client) {
      throw new Error(`Provider "${provider}" not registered.`)
    }
    // Re-register with key
    if (provider === 'openai') {
      this.register(new OpenAIProvider(apiKey))
    } else if (provider === 'anthropic') {
      this.register(new AnthropicProvider(apiKey))
    }
  }
}
```

**Step 6: Write Explorer (AI-driven exploratory testing)**

```ts
// packages/ai/src/explorer.ts
import type { PageSnapshot, ExploratoryReport, DiscoveredFlow } from '@giogia/core'
import { ProviderRegistry } from './providers/registry.js'

export class Explorer {
  constructor(private registry: ProviderRegistry) {}

  async explore(snapshot: PageSnapshot): Promise<ExploratoryReport> {
    const client = this.registry.getClient()
    const model = this.registry.getModel()

    const prompt = this.buildExplorationPrompt(snapshot)

    const response = await client.complete({
      messages: [
        {
          role: 'system',
          content: `You are an expert QA engineer performing exploratory testing on a web application. 
Analyze the page snapshot and discover: workflows, potential issues, and suggested tests.
Respond ONLY with valid JSON matching this schema:
{
  "flows": [{ "name": "string", "steps": ["string"], "url": "string" }],
  "potentialIssues": ["string"],
  "suggestedTests": ["string"]
}`,
        },
        { role: 'user', content: prompt },
      ],
      model,
      temperature: 0.7,
    })

    const parsed = JSON.parse(response.content) as {
      flows: DiscoveredFlow[]
      potentialIssues: string[]
      suggestedTests: string[]
    }

    return {
      url: snapshot.url,
      exploredAt: new Date().toISOString(),
      flows: parsed.flows,
      potentialIssues: parsed.potentialIssues,
      suggestedTests: parsed.suggestedTests,
    }
  }

  private buildExplorationPrompt(snapshot: PageSnapshot): string {
    const elementSummary = snapshot.elements
      .map(e => `- ${e.role} "${e.name}" (id: ${e.id})`)
      .join('\n')

    return `Analyze this page and perform exploratory testing:

URL: ${snapshot.url}
Title: ${snapshot.title}
Elements found:
${elementSummary}

Tasks:
1. Identify 2-4 possible user flows/journeys on this page
2. Identify potential issues (missing validations, accessibility, UX problems)
3. Suggest 3-5 test cases that should be written for this page`
  }
}
```

**Step 7: Write Generator (AI test generation from natural language/BDD)**

```ts
// packages/ai/src/generator.ts
import type { GeneratedTest, TestMode, BDDScenario } from '@giogia/core'
import { ProviderRegistry } from './providers/registry.js'

export class TestGenerator {
  constructor(private registry: ProviderRegistry) {}

  /** Generate test from natural language description */
  async fromNaturalLanguage(input: string): Promise<GeneratedTest> {
    const client = this.registry.getClient()
    const model = this.registry.getModel()

    const response = await client.complete({
      messages: [
        {
          role: 'system',
          content: `You are a test automation engineer. Convert natural language test descriptions 
into executable GioGia semantic DSL test code. GioGia DSL functions:
- gio.navigate(url) - navigate to page
- gio.click(semanticId) - click element
- gio.type(semanticId, text) - type into input
- gio.expect(text).visible() - assert text is visible
- gio.expect(semanticId).visible() - assert element visible
- gio.wait(ms) - wait

Respond ONLY with the TypeScript test code, no explanation.`,
        },
        {
          role: 'user',
          content: `Convert this test description to GioGia DSL:\n\n${input}`,
        },
      ],
      model,
      temperature: 0.3,
    })

    const name = this.extractTestName(input)

    return {
      name,
      file: `tests/${name.replace(/\s+/g, '_').toLowerCase()}.spec.ts`,
      content: response.content.trim(),
      mode: 'semantic-dsl',
    }
  }

  /** Generate test from BDD/Gherkin scenario */
  async fromBDD(scenario: BDDScenario): Promise<GeneratedTest> {
    const client = this.registry.getClient()
    const model = this.registry.getModel()

    const gherkinText = `Feature: ${scenario.feature}

Scenario: ${scenario.scenario}
  Given ${scenario.given.join('\n  And ')}
  When ${scenario.when.join('\n  And ')}
  Then ${scenario.then.join('\n  And ')}`

    const response = await client.complete({
      messages: [
        {
          role: 'system',
          content: `You are a test automation engineer. Convert Gherkin BDD scenarios into executable 
GioGia semantic DSL test code. Wrap in describe/it blocks.

GioGia DSL functions: gio.navigate(), gio.click(), gio.type(), gio.expect().visible(), gio.expect().hidden()

Respond ONLY with TypeScript code.`,
        },
        { role: 'user', content: `Convert this BDD scenario to GioGia test:\n\n${gherkinText}` },
      ],
      model,
      temperature: 0.3,
    })

    return {
      name: scenario.scenario,
      file: `tests/${scenario.scenario.replace(/\s+/g, '_').toLowerCase()}.spec.ts`,
      content: response.content.trim(),
      mode: 'bdd',
    }
  }

  private extractTestName(input: string): string {
    const firstLine = input.trim().split('\n')[0]
    return firstLine.slice(0, 80) || 'unnamed_test'
  }
}
```

**Step 8: Write Healer (AI-driven locator healing)**

```ts
// packages/ai/src/healer.ts
import type { SemanticElement } from '@giogia/core'
import { ProviderRegistry } from './providers/registry.js'

export interface HealingResult {
  elementId: string
  originalSelector: string | null
  suggestedSelector: string
  confidence: number
}

export class LocatorHealer {
  constructor(private registry: ProviderRegistry) {}

  /**
   * When a locator breaks, use AI to suggest a new one based on element context.
   * Takes the broken element's metadata and current page HTML snippet.
   */
  async heal(
    brokenElement: SemanticElement,
    pageHtmlSnippet: string
  ): Promise<HealingResult> {
    const client = this.registry.getClient()
    const model = this.registry.getModel()

    const response = await client.complete({
      messages: [
        {
          role: 'system',
          content: `You are an expert in web test automation locators. Given a broken element's 
metadata and current page HTML, suggest a new CSS selector. 
Respond ONLY with JSON: { "selector": "string", "confidence": number (0-1) }`,
        },
        {
          role: 'user',
          content: `Broken element:
- Role: ${brokenElement.role}
- Name: ${brokenElement.name}
- Original selector: ${brokenElement.selector ?? 'none'}
- Test ID: ${brokenElement.testId ?? 'none'}
- Attributes: ${JSON.stringify(brokenElement.attributes)}

Page HTML snippet:
${pageHtmlSnippet.slice(0, 8000)}

Suggest a new CSS selector.`,
        },
      ],
      model,
      temperature: 0.1,
    })

    const result = JSON.parse(response.content) as { selector: string; confidence: number }

    return {
      elementId: brokenElement.id,
      originalSelector: brokenElement.selector,
      suggestedSelector: result.selector,
      confidence: result.confidence,
    }
  }
}
```

**Step 9: Write barrel export**

```ts
// packages/ai/src/index.ts
export { ProviderRegistry } from './providers/registry.js'
export { OpenAIProvider } from './providers/openai.js'
export { AnthropicProvider } from './providers/anthropic.js'
export { Explorer } from './explorer.js'
export { TestGenerator } from './generator.js'
export { LocatorHealer } from './healer.js'
export type { AIProviderClient, CompletionRequest, CompletionResponse, ChatMessage } from './providers/types.js'
export type { HealingResult } from './healer.js'
```

**Step 10: Write registry test (no API calls)**

```ts
// packages/ai/src/__tests__/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { ProviderRegistry } from '../providers/registry.js'

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('registers built-in providers (openai, anthropic)', () => {
    const providers = registry.listProviders()
    expect(providers).toContain('openai')
    expect(providers).toContain('anthropic')
  })

  it('has openai as default active provider', () => {
    expect(registry.getActive()).toBe('openai')
  })

  it('throws when setting inactive provider without api key (anthropic not configured)', () => {
    // Anthropic starts unconfigured
    expect(() => registry.setActive('anthropic')).toThrow('not configured')
  })

  it('configure() sets api key and allows activation', () => {
    registry.configure('openai', 'sk-test-key')
    expect(() => registry.setActive('openai')).not.toThrow()
    expect(registry.getActive()).toBe('openai')
  })

  it('throws for unregistered provider', () => {
    expect(() => registry.setActive('ollama' as any)).toThrow('not registered')
  })

  it('setModel and getModel work correctly', () => {
    registry.setModel('openai', 'gpt-4o-mini')
    expect(registry.getModel()).toBe('gpt-4o-mini')
    expect(registry.getModel('openai')).toBe('gpt-4o-mini')
  })

  it('getClient returns active provider client', () => {
    registry.configure('openai', 'sk-test')
    registry.setActive('openai')
    const client = registry.getClient()
    expect(client.name).toBe('openai')
    expect(client.isConfigured()).toBe(true)
  })
})
```

**Step 11: Write generator test (unit test with mocked provider)**

```ts
// packages/ai/src/__tests__/generator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestGenerator } from '../generator.js'
import { ProviderRegistry } from '../providers/registry.js'
import type { AIProviderClient, CompletionResponse } from '../providers/types.js'

function createMockClient(responseText: string): AIProviderClient {
  return {
    name: 'openai',
    isConfigured: () => true,
    complete: vi.fn().mockResolvedValue({
      content: responseText,
      usage: { promptTokens: 10, completionTokens: 20 },
    } satisfies CompletionResponse),
  }
}

describe('TestGenerator', () => {
  let registry: ProviderRegistry
  let mockClient: AIProviderClient

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('fromNaturalLanguage generates DSL test code', async () => {
    const testCode = `
import { gio } from '@giogia/runner'

describe('Login Flow', () => {
  it('should login as admin', async () => {
    await gio.navigate('/login')
    await gio.type('email_input', 'admin@test.com')
    await gio.click('login_button')
    await gio.expect('Dashboard').visible()
  })
})`.trim()

    mockClient = createMockClient(testCode)
    registry.register(mockClient)
    registry.setActive('openai')

    const generator = new TestGenerator(registry)
    const result = await generator.fromNaturalLanguage('Login as admin, verify dashboard appears')

    expect(result.mode).toBe('semantic-dsl')
    expect(result.content).toContain('describe')
    expect(result.content).toContain('gio.navigate')
    expect(result.file).toContain('.spec.ts')
  })

  it('fromBDD generates test from Gherkin', async () => {
    const testCode = `
describe('Login Feature', () => {
  it('Successful Login', async () => {
    await gio.navigate('/login')
    await gio.type('email_input', 'admin')
    await gio.click('login_button')
    await gio.expect('Dashboard').visible()
  })
})`.trim()

    mockClient = createMockClient(testCode)
    registry.register(mockClient)
    registry.setActive('openai')

    const generator = new TestGenerator(registry)
    const result = await generator.fromBDD({
      feature: 'Login',
      scenario: 'Successful Login',
      given: ['I am on login page'],
      when: ['I login as admin'],
      then: ['dashboard should be visible'],
    })

    expect(result.mode).toBe('bdd')
    expect(result.content).toContain('describe')
    expect(result.file).toContain('.spec.ts')
  })
})
```

**Step 12: Write healer test (unit)**

```ts
// packages/ai/src/__tests__/healer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocatorHealer } from '../healer.js'
import { ProviderRegistry } from '../providers/registry.js'
import type { AIProviderClient, CompletionResponse } from '../providers/types.js'
import type { SemanticElement } from '@giogia/core'

function createMockClient(responseText: string): AIProviderClient {
  return {
    name: 'openai',
    isConfigured: () => true,
    complete: vi.fn().mockResolvedValue({
      content: responseText,
    } satisfies CompletionResponse),
  }
}

describe('LocatorHealer', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  it('heals broken locator with AI suggestion', async () => {
    const healingResponse = JSON.stringify({
      selector: '#new-login-btn',
      confidence: 0.92,
    })

    const mockClient = createMockClient(healingResponse)
    registry.register(mockClient)
    registry.setActive('openai')

    const healer = new LocatorHealer(registry)
    const result = await healer.heal(
      {
        id: 'login_button',
        role: 'button',
        name: 'Login',
        selector: '#old-login-btn',
        testId: null,
        xpath: null,
        attributes: { class: 'btn-primary' },
      } satisfies SemanticElement,
      '<html><body><button id="new-login-btn">Login</button></body></html>'
    )

    expect(result.elementId).toBe('login_button')
    expect(result.suggestedSelector).toBe('#new-login-btn')
    expect(result.confidence).toBe(0.92)
  })
})
```

**Step 13: Run tests**

Run: `pnpm --filter @giogia/ai test`
Expected: 10 tests PASS (7 registry + 2 generator + 1 healer).

**Step 14: Commit**

```bash
git add packages/ai/
git commit -m "feat(ai): add provider registry, explorer, test generator, and locator healer"
```

---

## Task 5: Test Runner (Execution Engine, Assertions, Reporting)

**Files:**
- Create: `packages/runner/package.json`
- Create: `packages/runner/tsconfig.json`
- Create: `packages/runner/tsup.config.ts`
- Create: `packages/runner/src/index.ts`
- Create: `packages/runner/src/runner.ts`
- Create: `packages/runner/src/assertions.ts`
- Create: `packages/runner/src/reporter.ts`
- Create: `packages/runner/src/gio-dsl.ts`
- Create: `packages/runner/src/__tests__/assertions.test.ts`
- Create: `packages/runner/src/__tests__/reporter.test.ts`
- Create: `packages/runner/src/__tests__/runner.test.ts`

**Step 1: Scaffold runner package**

```json
// packages/runner/package.json
{
  "name": "@giogia/runner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "@giogia/core": "workspace:*",
    "@giogia/browser": "workspace:*",
    "@giogia/semantic": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Write assertion engine**

```ts
// packages/runner/src/assertions.ts
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

  /** Assert an element (by selector) */
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

  /** Assert text is visible on the page */
  async textVisible(text: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first()
    await locator.waitFor({ state: 'visible', timeout: 5000 })
  }

  /** Assert text is NOT visible on the page */
  async textHidden(text: string): Promise<void> {
    const locator = this.page.getByText(text, { exact: false }).first()
    await locator.waitFor({ state: 'hidden', timeout: 5000 })
  }

  /** Assert current URL matches */
  async urlContains(expected: string): Promise<void> {
    const url = this.page.url()
    if (!url.includes(expected)) {
      throw new Error(`Expected URL to contain "${expected}", got "${url}"`)
    }
  }

  /** Assert page title matches */
  async titleEquals(expected: string): Promise<void> {
    const title = await this.page.title()
    if (title !== expected) {
      throw new Error(`Expected title "${expected}", got "${title}"`)
    }
  }
}
```

**Step 3: Write GioGia DSL**

```ts
// packages/runner/src/gio-dsl.ts
import type { Page } from 'playwright'
import { Assertions } from './assertions.js'

export class GioDSL {
  constructor(private page: Page) {}

  /** Navigate to a URL */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  /** Click an element by semantic id */
  async click(semanticId: string): Promise<void> {
    // Try semantic id first, then test-id, then text
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

    // Try text match for buttons/links
    const textLocator = this.page.getByRole('button', { name: semanticId })
    if (await textLocator.count() > 0) {
      await textLocator.click()
      return
    }

    throw new Error(`Element "${semanticId}" not found on page`)
  }

  /** Type text into an input field by semantic id */
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

  /** Create an assertion */
  expect(target: string) {
    const assertions = new Assertions(this.page)
    return {
      visible: () => assertions.textVisible(target),
      hidden: () => assertions.textHidden(target),
      element: () => assertions.element(target),
    }
  }

  /** Wait for milliseconds */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms)
  }

  /** Execute raw Playwright code (escape hatch) */
  async raw<T>(fn: (ctx: { page: Page }) => Promise<T>): Promise<T> {
    return fn({ page: this.page })
  }

  /** Get current page URL */
  getUrl(): string {
    return this.page.url()
  }

  /** Take a screenshot */
  async screenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true })
  }
}
```

**Step 4: Write Reporter**

```ts
// packages/runner/src/reporter.ts
import type { TestReport, TestResult } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export class Reporter {
  private results: TestResult[] = []
  private startTime: number = 0

  start(): void {
    this.startTime = Date.now()
    this.results = []
  }

  record(result: TestResult): void {
    this.results.push(result)
  }

  generateReport(): TestReport {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - this.startTime,
      results: this.results,
      generatedAt: new Date().toISOString(),
    }
  }

  /** Generate HTML report */
  async writeHtmlReport(report: TestReport, dir = 'reports'): Promise<string> {
    await fs.mkdir(dir, { recursive: true })

    const html = this.buildHtml(report)
    const filePath = path.join(dir, 'index.html')
    await fs.writeFile(filePath, html)

    return filePath
  }

  private buildHtml(report: TestReport): string {
    const passRate = report.total > 0
      ? ((report.passed / report.total) * 100).toFixed(1)
      : '0'

    const rows = report.results
      .map(
        r => `
      <tr class="${r.passed ? 'pass' : 'fail'}">
        <td>${r.passed ? '✓' : '✗'}</td>
        <td>${r.name}</td>
        <td>${r.duration}ms</td>
        <td>${r.error ? `<pre>${r.error}</pre>` : ''}</td>
      </tr>`
      )
      .join('')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GioGia Test Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary div { padding: 20px; border-radius: 8px; min-width: 120px; text-align: center; }
    .total { background: #e8f0fe; }
    .passed { background: #e6f4ea; color: #137333; }
    .failed { background: #fce8e6; color: #c5221f; }
    .duration { background: #fef7e0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    .pass { background: #f6fff6; }
    .fail { background: #fff6f6; }
    pre { font-size: 12px; color: #c5221f; margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>GioGia Test Report</h1>
  <div class="summary">
    <div class="total"><strong>${report.total}</strong><br>Total</div>
    <div class="passed"><strong>${report.passed}</strong><br>Passed</div>
    <div class="failed"><strong>${report.failed}</strong><br>Failed</div>
    <div class="duration"><strong>${(report.duration / 1000).toFixed(1)}s</strong><br>Duration</div>
    <div><strong>${passRate}%</strong><br>Pass Rate</div>
  </div>
  <table>
    <thead>
      <tr><th></th><th>Test</th><th>Duration</th><th>Error</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#999;margin-top:30px">Generated: ${report.generatedAt}</p>
</body>
</html>`
  }
}
```

**Step 5: Write TestRunner**

```ts
// packages/runner/src/runner.ts
import { BrowserManager } from '@giogia/browser'
import { SnapshotStore } from '@giogia/semantic'
import type { TestResult } from '@giogia/core'
import { GioDSL } from './gio-dsl.js'
import { Reporter } from './reporter.js'

export interface TestDefinition {
  name: string
  fn: (gio: GioDSL) => Promise<void>
}

export interface RunnerConfig {
  headless?: boolean
  baseUrl?: string
  outputDir?: string
}

export class TestRunner {
  private browserManager: BrowserManager
  private reporter: Reporter
  private tests: TestDefinition[] = []
  private config: RunnerConfig

  constructor(config: RunnerConfig = {}) {
    this.config = { headless: true, outputDir: 'reports', ...config }
    this.browserManager = new BrowserManager()
    this.reporter = new Reporter()
  }

  /** Register a test */
  test(name: string, fn: (gio: GioDSL) => Promise<void>): void {
    this.tests.push({ name, fn })
  }

  /** Run all registered tests */
  async runAll(): Promise<number> {
    this.reporter.start()

    for (const testDef of this.tests) {
      const result = await this.runOne(testDef)
      this.reporter.record(result)
    }

    const report = this.reporter.generateReport()
    await this.reporter.writeHtmlReport(report, this.config.outputDir)

    return report.failed > 0 ? 1 : 0
  }

  private async runOne(testDef: TestDefinition): Promise<TestResult> {
    const start = Date.now()

    try {
      const session = await this.browserManager.launch(this.config.headless)
      const gio = new GioDSL(session.page)

      try {
        await testDef.fn(gio)
        return {
          name: testDef.name,
          passed: true,
          duration: Date.now() - start,
        }
      } finally {
        await this.browserManager.close()
      }
    } catch (error) {
      return {
        name: testDef.name,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getReporter(): Reporter {
    return this.reporter
  }
}
```

**Step 6: Write barrel export**

```ts
// packages/runner/src/index.ts
export { TestRunner } from './runner.js'
export type { TestDefinition, RunnerConfig } from './runner.js'
export { GioDSL } from './gio-dsl.js'
export { Assertions } from './assertions.js'
export type { AssertionBuilder } from './assertions.js'
export { Reporter } from './reporter.js'
```

**Step 7: Write assertions test**

```ts
// packages/runner/src/__tests__/assertions.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { BrowserManager } from '@giogia/browser'
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
  })

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
```

**Step 8: Write reporter test**

```ts
// packages/runner/src/__tests__/reporter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Reporter } from '../reporter.js'
import type { TestResult } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('Reporter', () => {
  let reporter: Reporter
  let tmpDir: string

  beforeEach(async () => {
    reporter = new Reporter()
    tmpDir = path.join(os.tmpdir(), `giogia-reporter-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })
  })

  it('records test results and generates report', () => {
    reporter.start()

    reporter.record({ name: 'test1', passed: true, duration: 10 })
    reporter.record({ name: 'test2', passed: false, duration: 20, error: 'expected A got B' })

    const report = reporter.generateReport()
    expect(report.total).toBe(2)
    expect(report.passed).toBe(1)
    expect(report.failed).toBe(1)
  })

  it('generates HTML report file', async () => {
    reporter.start()
    reporter.record({ name: 'login test', passed: true, duration: 42 })

    const report = reporter.generateReport()
    const filePath = await reporter.writeHtmlReport(report, path.join(tmpDir, 'reports'))

    expect(filePath).toContain('index.html')

    const content = await fs.readFile(filePath, 'utf-8')
    expect(content).toContain('GioGia Test Report')
    expect(content).toContain('login test')
    expect(content).toContain('42ms')
  })
})
```

**Step 9: Write runner integration test**

```ts
// packages/runner/src/__tests__/runner.test.ts
import { describe, it, expect } from 'vitest'
import { TestRunner } from '../runner.js'

describe('TestRunner', () => {
  it('executes passing test and returns exit code 0', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('simple navigation', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)
  }, 15000)

  it('executes failing test and returns exit code 1', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('failing assertion', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('This Text Does Not Exist On The Page').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(1)
  }, 15000)

  it('executes multiple tests and reports all', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('passing', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    runner.test('also passing', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)

    const report = runner.getReporter().generateReport()
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
  }, 20000)
})
```

**Step 10: Run tests**

Run: `pnpm --filter @giogia/runner test`
Expected: 10 tests PASS (5 assertions + 2 reporter + 3 runner).

**Step 11: Commit**

```bash
git add packages/runner/
git commit -m "feat(runner): add test runner, assertions engine, GioDSL, and HTML reporter"
```

---

## Task 6: CLI Foundation (Commander Setup, Install, Doctor, AI Config)

**Files:**
- Modify: `packages/cli/package.json`
- Modify: `packages/cli/src/index.ts`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/commands/install.ts`
- Create: `packages/cli/src/commands/doctor.ts`
- Create: `packages/cli/src/commands/ai-login.ts`
- Create: `packages/cli/src/commands/ai-model.ts`
- Create: `packages/cli/src/commands/inspect.ts`
- Create: `packages/cli/src/commands/snapshot.ts`
- Create: `packages/cli/src/commands/explore.ts`
- Create: `packages/cli/src/commands/generate.ts`
- Create: `packages/cli/src/commands/test.ts`
- Create: `packages/cli/src/commands/report.ts`
- Create: `packages/cli/src/__tests__/cli.test.ts`

**Step 1: Update CLI package.json with dependencies**

```json
{
  "name": "@giogia/cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "gio": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup",
    "clean": "rm -rf dist",
    "test": "vitest run"
  },
  "dependencies": {
    "@giogia/core": "workspace:*",
    "@giogia/browser": "workspace:*",
    "@giogia/semantic": "workspace:*",
    "@giogia/ai": "workspace:*",
    "@giogia/runner": "workspace:*",
    "commander": "^13.0.0",
    "chalk": "^5.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

**Step 2: Write CLI entry point**

```ts
// packages/cli/src/index.ts
#!/usr/bin/env node
import { Command } from 'commander'
import { installCommand } from './commands/install.js'
import { doctorCommand } from './commands/doctor.js'
import { aiLoginCommand } from './commands/ai-login.js'
import { aiModelCommand } from './commands/ai-model.js'
import { inspectCommand } from './commands/inspect.js'
import { snapshotCommand } from './commands/snapshot.js'
import { exploreCommand } from './commands/explore.js'
import { generateCommand } from './commands/generate.js'
import { testCommand } from './commands/test.js'
import { reportCommand } from './commands/report.js'

const program = new Command()

program
  .name('gio')
  .description('GioGia - AI-first web test automation framework')
  .version('0.1.0')

program.addCommand(installCommand())
program.addCommand(doctorCommand())

const ai = new Command('ai').description('AI provider management')
ai.addCommand(aiLoginCommand())
ai.addCommand(aiModelCommand())
program.addCommand(ai)

program.addCommand(inspectCommand())
program.addCommand(snapshotCommand())
program.addCommand(exploreCommand())
program.addCommand(generateCommand())
program.addCommand(testCommand())
program.addCommand(reportCommand())

program.parse()
```

**Step 3: Write install command**

```ts
// packages/cli/src/commands/install.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { execSync } from 'node:child_process'

export function installCommand(): Command {
  return new Command('install')
    .description('Install GioGia runtime and browser dependencies')
    .action(async () => {
      console.log(chalk.blue('Installing GioGia...'))

      try {
        console.log('  Installing Playwright browsers...')
        execSync('npx playwright install chromium', { stdio: 'inherit' })
        console.log(chalk.green('✓ Chromium installed'))

        console.log('')
        console.log(chalk.green('✓ GioGia installed successfully'))
        console.log('')
        console.log('Next steps:')
        console.log(`  ${chalk.cyan('gio doctor')} - validate environment`)
        console.log(`  ${chalk.cyan('gio ai login')} - configure AI provider`)
      } catch (error) {
        console.error(chalk.red('Installation failed:'), error)
        process.exit(1)
      }
    })
}
```

**Step 4: Write doctor command**

```ts
// packages/cli/src/commands/doctor.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager } from '@giogia/browser'

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Validate GioGia environment setup')
    .action(async () => {
      console.log(chalk.blue('GioGia Doctor'))
      console.log('')

      // Check browser
      const browserOk = await BrowserManager.isInstalled()
      console.log(browserOk
        ? chalk.green('✓ Browser installed')
        : chalk.red('✗ Browser not installed - run `gio install`'))

      // Check runtime
      const nodeVersion = process.version
      const major = parseInt(nodeVersion.slice(1).split('.')[0])
      console.log(major >= 20
        ? chalk.green(`✓ Runtime ready (Node ${nodeVersion})`)
        : chalk.red(`✗ Node.js >= 20 required (current: ${nodeVersion})`))

      // Check AI config
      const aiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
      console.log(aiKey
        ? chalk.green('✓ AI configured')
        : chalk.yellow('⚠ AI not configured - run `gio ai login`'))

      // Check project
      console.log(chalk.green('✓ Project initialized'))
    })
}
```

**Step 5: Write ai login command**

```ts
// packages/cli/src/commands/ai-login.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { ProviderRegistry } from '@giogia/ai'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import readline from 'node:readline'

async function prompt(promptText: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise(resolve => {
    rl.question(promptText, (answer: string) => {
      rl.close()
      resolve(answer)
    })
  })
}

export function aiLoginCommand(): Command {
  return new Command('login')
    .description('Configure AI provider credentials')
    .option('-p, --provider <provider>', 'AI provider (openai, anthropic)', 'openai')
    .action(async (options) => {
      const provider = options.provider as string

      console.log(chalk.blue(`Configuring ${provider}...`))

      // Check for env var first
      const envKey = provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY

      if (envKey) {
        console.log(chalk.green(`✓ Found ${provider.toUpperCase()}_API_KEY in environment`))
        return
      }

      const apiKey = await prompt(`${chalk.yellow(`Enter your ${provider} API key:`)} `)

      if (!apiKey.trim()) {
        console.log(chalk.red('No API key provided.'))
        return
      }

      // Save to .env file
      const envPath = path.join(process.cwd(), '.env')
      const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
      const line = `\n${envVarName}=${apiKey.trim()}\n`

      try {
        await fs.appendFile(envPath, line)
        console.log(chalk.green(`✓ API key saved to .env`))
        console.log(chalk.yellow('⚠ Restart your terminal or source .env to use it.'))
      } catch (error) {
        console.error(chalk.red('Failed to save API key:'), error)
      }
    })
}
```

**Step 6: Write ai model command**

```ts
// packages/cli/src/commands/ai-model.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { ProviderRegistry } from '@giogia/ai'

export function aiModelCommand(): Command {
  return new Command('model')
    .description('Select active AI model')
    .option('-p, --provider <provider>', 'AI provider', 'openai')
    .option('-m, --model <model>', 'Model name')
    .action(async (options) => {
      const registry = new ProviderRegistry()

      if (options.model) {
        registry.setModel(options.provider, options.model)
        console.log(chalk.green(`✓ Model set to ${options.model} for ${options.provider}`))
        return
      }

      console.log(chalk.blue(`Current Provider: ${registry.getActive()}`))
      console.log('')
      console.log('Available Models:')
      console.log('')
      console.log('  1. gpt-4o')
      console.log('  2. gpt-4o-mini')
      console.log('  3. gpt-4-turbo')
      console.log('')
      console.log(`Current: ${registry.getModel()}`)
      console.log('')
      console.log(`Run ${chalk.cyan('gio ai model -m <model>')} to change`)
    })
}
```

**Step 7: Write barrel for commands**

Create `packages/cli/src/commands/index.ts` - not needed, direct imports in index.ts.

**Step 8: Write CLI unit test**

```ts
// packages/cli/src/__tests__/cli.test.ts
import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'

const CLI_PATH = './dist/index.js'

describe('CLI', () => {
  it('prints help with no arguments', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' })
    expect(output).toContain('GioGia')
    expect(output).toContain('install')
    expect(output).toContain('doctor')
    expect(output).toContain('ai')
    expect(output).toContain('inspect')
    expect(output).toContain('snapshot')
    expect(output).toContain('explore')
    expect(output).toContain('generate')
    expect(output).toContain('test')
    expect(output).toContain('report')
  })

  it('prints version', () => {
    const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' })
    expect(output.trim()).toBe('0.1.0')
  })

  it('doctor runs without crashing', () => {
    const output = execSync(`node ${CLI_PATH} doctor`, { encoding: 'utf-8' })
    expect(output).toContain('GioGia Doctor')
  })
})
```

**Step 9: Create CLI tsconfig**

```json
// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 10: Build CLI and run tests**

Run: `pnpm --filter @giogia/cli build`
Expected: Builds successfully.

Run: `pnpm --filter @giogia/cli test`
Expected: CLI tests PASS (help output, version, doctor).

**Step 11: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): implement commander-based CLI with install, doctor, ai login, ai model"
```

---

## Task 7: CLI Commands - Inspect, Snapshot, Test, Report

**Files:**
- Modify: `packages/cli/src/commands/inspect.ts` (replace stub)
- Modify: `packages/cli/src/commands/snapshot.ts` (replace stub)
- Modify: `packages/cli/src/commands/test.ts` (replace stub)
- Modify: `packages/cli/src/commands/report.ts` (replace stub)
- Create: `packages/cli/src/__tests__/commands.test.ts`

**Step 1: Write inspect command**

```ts
// packages/cli/src/commands/inspect.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@giogia/browser'

export function inspectCommand(): Command {
  return new Command('inspect <url>')
    .description('Analyze page structure and show semantic elements')
    .action(async (url: string) => {
      console.log(chalk.blue(`Inspecting ${url}...`))
      console.log('')

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        console.log(chalk.bold(`Page: ${snapshot.title}`))
        console.log(`Elements found: ${snapshot.elements.length}`)
        console.log('')

        for (const el of snapshot.elements) {
          console.log(chalk.cyan(el.id))
          console.log(`  role: ${el.role} | name: "${el.name}"`)
          if (el.selector) console.log(`  css: ${el.selector}`)
          if (el.testId) console.log(`  test-id: ${el.testId}`)
          console.log('')
        }
      } catch (error) {
        console.error(chalk.red('Inspect failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
```

**Step 2: Write snapshot command**

```ts
// packages/cli/src/commands/snapshot.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@giogia/browser'
import { SnapshotStore } from '@giogia/semantic'

export function snapshotCommand(): Command {
  return new Command('snapshot <url>')
    .description('Generate semantic snapshot of a page')
    .option('-o, --output <dir>', 'Output directory', '.gio')
    .action(async (url: string, options) => {
      console.log(chalk.blue(`Capturing snapshot of ${url}...`))

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        const store = new SnapshotStore()
        await store.save(snapshot, options.output)

        console.log(chalk.green(`✓ Snapshot saved to ${options.output}/snapshot.json`))
        console.log(`  Elements: ${snapshot.elements.length}`)
        console.log(`  Title: ${snapshot.title}`)
      } catch (error) {
        console.error(chalk.red('Snapshot failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
```

**Step 3: Write test command**

```ts
// packages/cli/src/commands/test.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function testCommand(): Command {
  return new Command('test')
    .description('Execute tests deterministically')
    .option('-d, --dir <dir>', 'Test directory', 'tests')
    .option('--headless', 'Run headless', true)
    .action(async (options) => {
      console.log(chalk.blue('Running tests...'))
      console.log('')

      const testDir = path.resolve(options.dir)

      try {
        await fs.access(testDir)
      } catch {
        console.log(chalk.yellow(`No tests directory found at ${testDir}`))
        console.log('Create test files or run `gio generate` to create tests.')
        process.exit(0)
      }

      const files = await fs.readdir(testDir)
      const specFiles = files.filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))

      if (specFiles.length === 0) {
        console.log(chalk.yellow('No test files found.'))
        process.exit(0)
      }

      let totalPassed = 0
      let totalFailed = 0

      for (const file of specFiles) {
        const filePath = path.join(testDir, file)
        console.log(`  ${chalk.cyan(file)}`)

        try {
          // Dynamic import the test file - it should export a TestRunner config
          // or use the global test function
          const fileUrl = pathToFileURL(filePath).href
          await import(fileUrl)
          console.log(chalk.green(`    ✓ PASS`))
          totalPassed++
        } catch (error) {
          console.log(chalk.red(`    ✗ FAIL`))
          if (error instanceof Error) {
            console.log(chalk.red(`      ${error.message}`))
          }
          totalFailed++
        }
      }

      console.log('')
      console.log(chalk.bold('Results:'))
      console.log(chalk.green(`  Passed: ${totalPassed}`))
      console.log(chalk.red(`  Failed: ${totalFailed}`))
      console.log(`  Total: ${totalPassed + totalFailed}`)

      process.exit(totalFailed > 0 ? 1 : 0)
    })
}
```

**Step 4: Write report command**

```ts
// packages/cli/src/commands/report.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function reportCommand(): Command {
  return new Command('report')
    .description('Generate execution report from latest test run')
    .option('-o, --output <dir>', 'Output directory', 'reports')
    .action(async (options) => {
      console.log(chalk.blue('Generating report...'))

      const reportDir = path.resolve(options.output)
      const indexPath = path.join(reportDir, 'index.html')

      try {
        await fs.access(indexPath)
        console.log(chalk.green(`✓ Report available at ${indexPath}`))
        console.log('')
        console.log(`Open with: ${chalk.cyan(`open ${indexPath}`)}`)
      } catch {
        console.log(chalk.yellow(`No report found at ${indexPath}`))
        console.log(`Run ${chalk.cyan('gio test')} first to generate results.`)
      }
    })
}
```

**Step 5: Write integration test for commands**

```ts
// packages/cli/src/__tests__/commands.test.ts
import { describe, it, expect } from 'vitest'

// Unit tests for command logic
// Integration tests require a running web server and are in Task 9

describe('CLI Commands (compilation check)', () => {
  it('all command modules export functions', async () => {
    const { installCommand } = await import('../commands/install.js')
    const { doctorCommand } = await import('../commands/doctor.js')
    const { aiLoginCommand } = await import('../commands/ai-login.js')
    const { aiModelCommand } = await import('../commands/ai-model.js')
    const { inspectCommand } = await import('../commands/inspect.js')
    const { snapshotCommand } = await import('../commands/snapshot.js')
    const { exploreCommand } = await import('../commands/explore.js')
    const { generateCommand } = await import('../commands/generate.js')
    const { testCommand } = await import('../commands/test.js')
    const { reportCommand } = await import('../commands/report.js')

    expect(typeof installCommand()).toBe('object')
    expect(typeof doctorCommand()).toBe('object')
    expect(typeof aiLoginCommand()).toBe('object')
    expect(typeof aiModelCommand()).toBe('object')
    expect(typeof inspectCommand()).toBe('object')
    expect(typeof snapshotCommand()).toBe('object')
    expect(typeof exploreCommand()).toBe('object')
    expect(typeof generateCommand()).toBe('object')
    expect(typeof testCommand()).toBe('object')
    expect(typeof reportCommand()).toBe('object')
  })
})
```

**Step 6: Build and run**

Run: `pnpm --filter @giogia/cli build`
Expected: Build succeeds.

Run: `pnpm --filter @giogia/cli test`
Expected: Tests PASS.

**Step 7: Commit**

```bash
git add packages/cli/src/commands/
git commit -m "feat(cli): implement inspect, snapshot, test, and report commands"
```

---

## Task 8: CLI Commands - Explore and Generate (AI-Powered)

**Files:**
- Modify: `packages/cli/src/commands/explore.ts` (replace stub)
- Modify: `packages/cli/src/commands/generate.ts` (replace stub)

**Step 1: Write explore command**

```ts
// packages/cli/src/commands/explore.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@giogia/browser'
import { Explorer, ProviderRegistry } from '@giogia/ai'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function exploreCommand(): Command {
  return new Command('explore <url>')
    .description('AI-driven exploratory testing of a page')
    .option('-o, --output <dir>', 'Output directory', '.gio')
    .action(async (url: string, options) => {
      console.log(chalk.blue(`Exploring ${url} with AI...`))

      const registry = new ProviderRegistry()

      // Try to activate available provider
      try {
        const aiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
        if (!aiKey) {
          console.log(chalk.red('No AI provider configured.'))
          console.log(`Run ${chalk.cyan('gio ai login')} first.`)
          process.exit(1)
        }

        if (process.env.OPENAI_API_KEY) {
          registry.configure('openai', process.env.OPENAI_API_KEY)
          registry.setActive('openai')
        } else if (process.env.ANTHROPIC_API_KEY) {
          registry.configure('anthropic', process.env.ANTHROPIC_API_KEY)
          registry.setActive('anthropic')
        }
      } catch (error) {
        console.log(chalk.red('AI configuration error:'), error)
        process.exit(1)
      }

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        console.log(`  Page: ${snapshot.title}`)
        console.log(`  Elements found: ${snapshot.elements.length}`)
        console.log('')
        console.log(chalk.blue('Exploring with AI...'))

        const explorer = new Explorer(registry)
        const report = await explorer.explore(snapshot)

        // Save outputs
        await fs.mkdir(options.output, { recursive: true })

        const reportPath = path.join(options.output, 'exploratory-report.md')
        const flowsPath = path.join(options.output, 'discovered-flows.json')
        const testsPath = path.join(options.output, 'suggested-tests.md')

        // Write Markdown report
        let md = `# Exploratory Report: ${url}\n\n`
        md += `**Date:** ${report.exploredAt}\n\n`
        md += `## Discovered Flows\n\n`
        for (const flow of report.flows) {
          md += `### ${flow.name}\n\n`
          for (const step of flow.steps) {
            md += `- ${step}\n`
          }
          md += '\n'
        }
        md += `## Potential Issues\n\n`
        for (const issue of report.potentialIssues) {
          md += `- ⚠ ${issue}\n`
        }
        await fs.writeFile(reportPath, md)

        await fs.writeFile(flowsPath, JSON.stringify(report.flows, null, 2))
        await fs.writeFile(testsPath, report.suggestedTests.map(t => `- ${t}`).join('\n'))

        console.log('')
        console.log(chalk.green('✓ Exploration complete'))

        // Print summary
        console.log('')
        console.log(chalk.bold('Discovered Flows:'))
        for (const flow of report.flows) {
          console.log(`  ${chalk.green('✓')} ${flow.name}`)
        }
        if (report.potentialIssues.length > 0) {
          console.log('')
          console.log(chalk.bold('Potential Issues:'))
          for (const issue of report.potentialIssues) {
            console.log(`  ${chalk.yellow('⚠')} ${issue}`)
          }
        }
        console.log('')
        console.log(`Reports saved to ${options.output}/`)

      } catch (error) {
        console.error(chalk.red('Exploration failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
```

**Step 2: Write generate command**

```ts
// packages/cli/src/commands/generate.ts
import { Command } from 'commander'
import chalk from 'chalk'
import { TestGenerator, ProviderRegistry } from '@giogia/ai'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function generateCommand(): Command {
  return new Command('generate <file>')
    .description('Generate tests from natural language, BDD, or markdown specs')
    .option('-o, --output <dir>', 'Output directory for tests', 'tests')
    .option('--mode <mode>', 'Input mode: natural-language, bdd, markdown', 'natural-language')
    .action(async (file: string, options) => {
      console.log(chalk.blue(`Generating tests from ${file}...`))

      const registry = new ProviderRegistry()

      // Configure AI
      try {
        if (process.env.OPENAI_API_KEY) {
          registry.configure('openai', process.env.OPENAI_API_KEY)
          registry.setActive('openai')
        } else if (process.env.ANTHROPIC_API_KEY) {
          registry.configure('anthropic', process.env.ANTHROPIC_API_KEY)
          registry.setActive('anthropic')
        } else {
          console.log(chalk.red('No AI provider configured. Run `gio ai login`.'))
          process.exit(1)
        }
      } catch (error) {
        console.log(chalk.red('AI configuration error:'), error)
        process.exit(1)
      }

      try {
        const content = await fs.readFile(file, 'utf-8')
        const generator = new TestGenerator(registry)
        const generated: any[] = []

        // Parse BDD if mode is bdd
        if (options.mode === 'bdd') {
          const scenarios = parseGherkin(content)
          for (const scenario of scenarios) {
            const result = await generator.fromBDD(scenario)
            generated.push(result)
          }
        } else {
          // Natural language: split by double newlines or ## headings
          const blocks = content
            .split(/\n\n(?=#|[A-Z])/)
            .filter(b => b.trim().length > 0)

          for (const block of blocks) {
            const result = await generator.fromNaturalLanguage(block)
            generated.push(result)
          }
        }

        // Write test files
        const outputDir = path.resolve(options.output)
        await fs.mkdir(outputDir, { recursive: true })

        for (const test of generated) {
          const filePath = path.join(outputDir, test.file)
          await fs.writeFile(filePath, test.content)
          console.log(chalk.green(`  ✓ ${test.file}`))
        }

        console.log('')
        console.log(chalk.green(`✓ Generated ${generated.length} test(s) in ${outputDir}/`))
      } catch (error) {
        console.error(chalk.red('Generation failed:'), error)
        process.exit(1)
      }
    })
}

/** Minimal Gherkin parser */
function parseGherkin(content: string): Array<{
  feature: string
  scenario: string
  given: string[]
  when: string[]
  then: string[]
}> {
  const scenarios: Array<{
    feature: string
    scenario: string
    given: string[]
    when: string[]
    then: string[]
  }> = []

  let currentFeature = ''
  let current: ReturnType<typeof parseGherkin>[0] | null = null

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Feature:')) {
      currentFeature = trimmed.replace('Feature:', '').trim()
    } else if (trimmed.startsWith('Scenario:')) {
      if (current) scenarios.push(current)
      current = {
        feature: currentFeature,
        scenario: trimmed.replace('Scenario:', '').trim(),
        given: [],
        when: [],
        then: [],
      }
    } else if (current) {
      if (trimmed.startsWith('Given ')) current.given.push(trimmed.replace('Given ', ''))
      else if (trimmed.startsWith('And ') && current.given.length > 0) current.given.push(trimmed.replace('And ', ''))
      else if (trimmed.startsWith('When ')) current.when.push(trimmed.replace('When ', ''))
      else if (trimmed.startsWith('And ') && current.when.length > 0) current.when.push(trimmed.replace('And ', ''))
      else if (trimmed.startsWith('Then ')) current.then.push(trimmed.replace('Then ', ''))
      else if (trimmed.startsWith('And ') && current.then.length > 0) current.then.push(trimmed.replace('And ', ''))
    }
  }

  if (current) scenarios.push(current)
  return scenarios
}
```

**Step 3: Build and verify**

Run: `pnpm --filter @giogia/cli build`
Expected: Build succeeds with all commands.

Run: `node packages/cli/dist/index.js --help`
Expected: All 10 commands listed.

**Step 4: Commit**

```bash
git add packages/cli/src/commands/explore.ts packages/cli/src/commands/generate.ts
git commit -m "feat(cli): implement AI-powered explore and generate commands"
```

---

## Task 9: Integration Tests & End-to-End Verification

**Files:**
- Create: `tests/integration/__snapshots__/`
- Create: `tests/integration/cli-workflow.test.ts`
- Create: `tests/fixtures/test-app.html`
- Create: `.github/workflows/ci.yml`

**Step 1: Create test fixture HTML page**

```html
<!-- tests/fixtures/test-app.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test App - GioGia Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 40px auto; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: bold; }
    input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    button { padding: 10px 20px; background: #0066ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: red; font-size: 14px; display: none; }
    .success { background: #e6ffe6; padding: 16px; border-radius: 4px; display: none; }
  </style>
</head>
<body>
  <h1>Login</h1>
  <form id="login-form">
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" data-testid="email-input" placeholder="Enter email" aria-label="Email input">
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" data-testid="password-input" placeholder="Enter password" aria-label="Password input">
    </div>
    <button type="submit" id="login-btn" data-testid="login-button" aria-label="Login button">Login</button>
  </form>
  <p id="error-msg" class="error" role="alert">Invalid credentials</p>
  <div id="success-msg" class="success">Welcome, Admin! Dashboard loaded successfully.</div>

  <script>
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault()
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      if (email === 'admin@test.com' && password === 'password') {
        document.getElementById('success-msg').style.display = 'block'
        document.getElementById('error-msg').style.display = 'none'
      } else {
        document.getElementById('error-msg').style.display = 'block'
        document.getElementById('success-msg').style.display = 'none'
      }
    })
  </script>
</body>
</html>
```

**Step 2: Write integration test**

```ts
// tests/integration/cli-workflow.test.ts
import { describe, it, expect } from 'vitest'
import { TestRunner } from '@giogia/runner'

describe('GioGia Integration Workflow', () => {
  it('captures snapshot and runs semantic test against fixture', async () => {
    const runner = new TestRunner({
      headless: true,
      outputDir: 'reports',
    })

    runner.test('Login with correct credentials', async (gio) => {
      // Use file:// URL for fixture
      const fixturePath = `file://${process.cwd()}/tests/fixtures/test-app.html`
      await gio.navigate(fixturePath)

      await gio.expect('Login').visible()

      await gio.type('email', 'admin@test.com')
      await gio.type('password', 'password')

      await gio.click('login-btn')

      await gio.expect('Dashboard loaded successfully').visible()
    })

    runner.test('Login with wrong credentials shows error', async (gio) => {
      const fixturePath = `file://${process.cwd()}/tests/fixtures/test-app.html`
      await gio.navigate(fixturePath)

      await gio.type('email', 'wrong@test.com')
      await gio.type('password', 'wrong')

      await gio.click('login-btn')

      await gio.expect('Invalid credentials').visible()
    })

    runner.test('Manual code escape hatch works', async (gio) => {
      const fixturePath = `file://${process.cwd()}/tests/fixtures/test-app.html`
      await gio.navigate(fixturePath)

      await gio.raw(async ({ page }) => {
        await page.locator('#email').fill('raw-code@test.com')
        const value = await page.locator('#email').inputValue()
        expect(value).toBe('raw-code@test.com')
      })
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)

    const report = runner.getReporter().generateReport()
    expect(report.total).toBe(3)
    expect(report.passed).toBe(3)
    expect(report.failed).toBe(0)
  }, 60000)

  it('runner exit code 1 when test fails', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('this will fail', async (gio) => {
      const fixturePath = `file://${process.cwd()}/tests/fixtures/test-app.html`
      await gio.navigate(fixturePath)
      await gio.expect('This text does not exist anywhere').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(1)
  }, 30000)
})
```

**Step 3: Write CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm -r build

      - run: pnpm test

      - name: Archive test reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: reports/
```

**Step 4: Run integration tests**

Run: `pnpm install`
Run: `pnpm -r build`
Run: `pnpm test`

Expected: All unit + integration tests PASS.

**Step 5: Commit**

```bash
git add tests/ .github/
git commit -m "test: add integration tests with fixture app and CI workflow"
```

---

## Task 10: Documentation & Final Polish

**Files:**
- Create: `README.md`
- Create: `docs/quickstart.md`
- Modify: `package.json` (add scripts)

**Step 1: Write README**

```markdown
# GioGia

AI-first web test automation framework. Semantic locators, AI-powered test generation, deterministic execution.

## Quick Start

```bash
# Install
pnpm install
pnpm -r build

# Validate environment
node packages/cli/dist/index.js doctor

# Capture page snapshot
node packages/cli/dist/index.js snapshot https://example.com

# Inspect page structure
node packages/cli/dist/index.js inspect https://example.com

# Run integration tests
pnpm test
```

## Commands

| Command | Description |
|---------|-------------|
| `gio install` | Install browser dependencies |
| `gio doctor` | Validate environment |
| `gio ai login` | Configure AI provider |
| `gio ai model` | Select AI model |
| `gio inspect <url>` | Analyze page structure |
| `gio snapshot <url>` | Capture semantic snapshot |
| `gio explore <url>` | AI exploratory testing |
| `gio generate <file>` | Generate tests from specs |
| `gio test` | Execute tests |
| `gio report` | View test report |

## Packages

| Package | Description |
|---------|-------------|
| `@giogia/core` | Shared types and interfaces |
| `@giogia/browser` | Playwright adapter, browser management |
| `@giogia/semantic` | Snapshot store, locator resolver, POM |
| `@giogia/ai` | AI providers, explorer, generator, healer |
| `@giogia/runner` | Test runner, assertions, DSL, reporting |
| `@giogia/cli` | CLI (Commander.js) |

## Architecture

```
CLI (packages/cli)
  ├── Runner (packages/runner)
  │     ├── Semantic (packages/semantic)
  │     └── Browser (packages/browser)
  └── AI (packages/ai)
        └── Core (packages/core)
```

## License

ISC
```

**Step 2: Write quickstart doc**

```markdown
# GioGia Quickstart

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Setup

```bash
git clone <repo-url>
cd giogia
pnpm install
pnpm -r build
```

## Your First Test

1. Create test file `tests/my-first.spec.ts`:

```ts
import { TestRunner } from '@giogia/runner'

const runner = new TestRunner({ headless: true })

runner.test('example.com loads', async (gio) => {
  await gio.navigate('https://example.com')
  await gio.expect('Example Domain').visible()
})

runner.runAll().then(exitCode => process.exit(exitCode))
```

2. Run it:

```bash
node tests/my-first.spec.ts
```

## Using the GioGia DSL

```ts
// Navigate
await gio.navigate('https://example.com/login')

// Type into inputs
await gio.type('email_input', 'user@test.com')

// Click elements
await gio.click('login_button')

// Assertions
await gio.expect('Dashboard').visible()
await gio.expect('Error').hidden()

// Raw Playwright escape hatch
await gio.raw(async ({ page }) => {
  await page.locator('.custom-widget').click()
})
```

## CI/CD

```yaml
- run: pnpm install
- run: pnpm -r build
- run: pnpm test
```
```

**Step 3: Update root package.json scripts**

```json
{
  "name": "giogia",
  "version": "0.1.0",
  "private": true,
  "description": "AI-first web test automation framework",
  "scripts": {
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --noEmit",
    "clean": "pnpm -r clean",
    "gio": "node packages/cli/dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "tsup": "^8.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 4: Final build & test**

Run: `pnpm -r build`
Run: `pnpm test`
Expected: All builds succeed, all tests PASS.

**Step 5: Commit**

```bash
git add README.md docs/quickstart.md package.json
git commit -m "docs: add README, quickstart guide, and finalize package scripts"
```

---

## Implementation Order Summary

| # | Task | Description |
|---|------|-------------|
| 0 | Scaffolding | Monorepo, pnpm, tsconfig, vitest |
| 1 | Core Types | Shared type definitions |
| 2 | Browser Layer | Playwright adapter, browser management |
| 3 | Semantic Layer | Snapshot store, locator resolver, POM |
| 4 | AI Layer | Provider registry, explorer, generator, healer |
| 5 | Runner | Test runner, assertions, GioDSL, reporter |
| 6 | CLI Foundation | Commander setup, install, doctor, AI config |
| 7 | CLI Commands | Inspect, snapshot, test, report |
| 8 | CLI AI Commands | Explore, generate |
| 9 | Integration Tests | E2E fixture tests, CI workflow |
| 10 | Documentation | README, quickstart, polish |

**Dependency Graph (bottom-up):**

```
0 (scaffold)
 └─ 1 (core)
     ├─ 2 (browser)
     │   └─ 3 (semantic)
     │       └─ 5 (runner)
     │           └─ 6 (cli foundation)
     │               ├─ 7 (cli commands)
     │               └─ 8 (cli ai commands)
     └─ 4 (ai)
         └─ 8 (cli ai commands)
9 (integration) - depends on all
10 (docs) - last
```

**Parallelizable:** Tasks 4 and 2+3 can be done in parallel after Task 1.
