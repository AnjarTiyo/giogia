# GioGia

AI-first web test automation framework.

**Semantic locators • AI-powered test generation • Deterministic execution**

## Quick Start

```bash
# Install CLI globally
npm i -g @anjartiyo/giogia-cli

# Verify
giogia doctor

# Capture snapshot
giogia snapshot https://example.com

# Run tests
giogia test
```

## Development

```bash
git clone <repo-url>
npm install
npm run build
npm test
```

## Commands

| Command | Description |
|---------|-------------|
| `giogia install` | Install browser dependencies |
| `giogia doctor` | Validate environment |
| `giogia ai login` | Configure AI provider |
| `giogia ai model` | Select AI model |
| `giogia inspect <url>` | Analyze page structure |
| `giogia snapshot <url>` | Capture semantic snapshot |
| `giogia explore <url>` | AI exploratory testing |
| `giogia generate <file>` | Generate tests from specs |
| `giogia test` | Execute tests |
| `giogia report` | View test report |

## Packages

| Package | Description |
|---------|-------------|
| `@anjartiyo/giogia-core` | Shared types and interfaces |
| `@anjartiyo/giogia-browser` | Playwright adapter, browser management |
| `@anjartiyo/giogia-semantic` | Snapshot store, locator resolver, POM |
| `@anjartiyo/giogia-ai` | AI providers, explorer, generator, healer |
| `@anjartiyo/giogia-runner` | Test runner, assertions, DSL, reporting |
| `@anjartiyo/giogia-cli` | CLI (Commander.js) |

## Architecture

```
CLI (packages/cli)
  ├── Runner (packages/runner)
  │     ├── Semantic (packages/semantic)
  │     └── Browser (packages/browser)
  └── AI (packages/ai)
        └── Core (packages/core)
```

## Test Authoring Modes

### Natural Language
```text
Login as admin
Verify dashboard appears
```

### BDD (Gherkin)
```gherkin
Feature: Login
Scenario: Successful Login
  Given I am on login page
  When I login as admin
  Then dashboard should be visible
```

### Semantic DSL
```ts
await gio.navigate('/login')
await gio.type('email_input', 'admin@test.com')
await gio.click('login_button')
await gio.expect('Dashboard').visible()
```

### Manual Coding (Escape Hatch)
```ts
await gio.raw(async ({ page }) => {
  await page.locator('.custom-widget').click()
})
```

## License

ISC
