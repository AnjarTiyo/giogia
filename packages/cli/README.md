# @anjartiyo/giogia-cli

GioGia CLI - AI-first web test automation framework.

## Install

```bash
npm install -g @anjartiyo/giogia-cli
giogia doctor
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

## Quick Example

```bash
# Capture snapshot
giogia snapshot https://example.com/login

# AI explore
giogia explore https://example.com/login

# Generate and run tests
echo "Login as admin, verify dashboard" > spec.md
giogia generate spec.md
giogia test
giogia report
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
