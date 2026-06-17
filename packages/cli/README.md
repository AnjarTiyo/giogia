# @anjartiyo/giogia-cli

GioGia CLI - AI-first web test automation framework.

## Install

```bash
npm install -g @anjartiyo/giogia-cli
gio doctor
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

## Quick Example

```bash
# Capture snapshot
gio snapshot https://example.com/login

# AI explore
gio explore https://example.com/login

# Generate and run tests
echo "Login as admin, verify dashboard" > spec.md
gio generate spec.md
gio test
gio report
```

## Test Authoring

```ts
import { TestRunner } from '@anjartiyo/giogia-runner'

const runner = new TestRunner({ headless: true })

runner.test('hello world', async (gio) => {
  await gio.navigate('https://example.com')
  await gio.expect('Example Domain').visible()
})

runner.runAll().then(code => process.exit(code))
```
