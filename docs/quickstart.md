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

## Verify

```bash
node packages/cli/dist/index.js doctor
```

Expected output:
```
GioGia Doctor
✓ Browser installed
✓ Runtime ready
✓ Project initialized
```

## Your First Test

Create `tests/my-first.spec.ts`:

```ts
import { TestRunner } from '@anjartiyo/giogia-runner'

const runner = new TestRunner({ headless: true })

runner.test('example.com loads', async (gio) => {
  await gio.navigate('https://example.com')
  await gio.expect('Example Domain').visible()
})

runner.runAll().then(exitCode => process.exit(exitCode))
```

Run it:
```bash
node tests/my-first.spec.ts
```

## GioGia DSL Reference

```ts
// Navigation
await gio.navigate('https://example.com/login')

// Typing into inputs (by semantic id, test-id, aria-label, or element id)
await gio.type('email_input', 'user@test.com')
await gio.type('password_input', 's3cret')

// Clicking elements
await gio.click('login_button')

// Assertions
await gio.expect('Dashboard').visible()
await gio.expect('Error').hidden()

// Element-level assertions
await gio.expect('#my-btn').element().enabled()
await gio.expect('#my-btn').element().hasText('Submit')

// Raw Playwright escape hatch
await gio.raw(async ({ page }) => {
  await page.locator('.custom-widget').click()
})

// Screenshots
await gio.screenshot('screenshots/failure.png')

// Waiting
await gio.wait(1000)
```

## Snapshots

```bash
# Capture page snapshot
node packages/cli/dist/index.js snapshot https://example.com/login

# Output: .gio/snapshot.json
```

```json
{
  "url": "https://example.com/login",
  "title": "Login Page",
  "elements": [
    {
      "id": "email_input",
      "role": "textbox",
      "name": "Email",
      "selector": "#email"
    }
  ]
}
```

## AI-Powered Features

### Explore
```bash
# AI explores page and discovers workflows/issues
node packages/cli/dist/index.js explore https://example.com/login
```

### Generate
```bash
# Generate tests from natural language spec
echo "Login as admin, verify dashboard" > spec.md
node packages/cli/dist/index.js generate spec.md

# Generate from BDD
node packages/cli/dist/index.js generate login.feature --mode bdd
```

## CI/CD

```yaml
- run: pnpm install
- run: pnpm -r build
- run: pnpm test
```
