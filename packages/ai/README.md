# @anjartiyo/giogia-ai

AI provider abstraction for GioGia. Multi-provider support (OpenAI, Anthropic), exploratory testing, test generation, and locator healing.

## Usage

### Provider Configuration
```ts
import { ProviderRegistry } from '@anjartiyo/giogia-ai'

const registry = new ProviderRegistry()
registry.configure('openai', process.env.OPENAI_API_KEY)
registry.setActive('openai')
registry.setModel('openai', 'gpt-4o-mini')
```

### Exploratory Testing
```ts
import { Explorer } from '@anjartiyo/giogia-ai'

const explorer = new Explorer(registry)
const report = await explorer.explore(snapshot)
// { flows: [...], potentialIssues: [...], suggestedTests: [...] }
```

### Test Generation
```ts
import { TestGenerator } from '@anjartiyo/giogia-ai'

const generator = new TestGenerator(registry)
const test = await generator.fromNaturalLanguage('Login as admin, verify dashboard')
const scenarios = await generator.fromBDD({ feature: 'Login', scenario: '...', ... })
```

### Locator Healing
```ts
import { LocatorHealer } from '@anjartiyo/giogia-ai'

const healer = new LocatorHealer(registry)
const result = await healer.heal(brokenElement, pageHtml)
// { suggestedSelector: '#new-btn', confidence: 0.92 }
```

## Supported Providers

| Provider | Model Examples |
|----------|---------------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Anthropic | claude-sonnet-4-20250514 |

## Install

```bash
npm install @anjartiyo/giogia-ai
```
