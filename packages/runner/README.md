# @anjartiyo/giogia-runner

Test runner for GioGia. Deterministic execution engine with semantic GioDSL, assertion library, and HTML reporting.

## Usage

```ts
import { TestRunner } from '@anjartiyo/giogia-runner'

const runner = new TestRunner({ headless: true })

runner.test('login flow', async (gio) => {
  await gio.navigate('https://example.com/login')
  await gio.type('email_input', 'admin@test.com')
  await gio.type('password_input', 's3cret')
  await gio.click('login_button')
  await gio.expect('Dashboard').visible()
})

const exitCode = await runner.runAll()
process.exit(exitCode) // 0 = pass, 1 = fail
```

## GioDSL Reference

| Method | Description |
|--------|-------------|
| `gio.navigate(url)` | Navigate to URL |
| `gio.click(id)` | Click by semantic id, test-id, or aria-label |
| `gio.type(id, text)` | Type into input field |
| `gio.expect(text).visible()` | Assert text visible on page |
| `gio.expect(text).hidden()` | Assert text not visible |
| `gio.expect('#sel').element().enabled()` | Assert element enabled |
| `gio.wait(ms)` | Pause execution |
| `gio.raw(async ({page}) => {...})` | Raw Playwright escape hatch |
| `gio.screenshot(path)` | Take full-page screenshot |

## HTML Reporter

Test results automatically written to `reports/index.html` with pass/fail summary, durations, and error details.

## Install

```bash
npm install @anjartiyo/giogia-runner
```
