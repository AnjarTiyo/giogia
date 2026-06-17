# @anjartiyo/giogia-semantic

Semantic locator engine for GioGia. Snapshot storage, multi-strategy locator resolution, and Page Object Model generation.

## Usage

### Snapshot Store
```ts
import { SnapshotStore } from '@anjartiyo/giogia-semantic'

const store = new SnapshotStore()
await store.save(snapshot, '.gio')
const loaded = await store.load('.gio/snapshot.json')
const element = store.findElement('login_button')
```

### Locator Resolution
```ts
import { LocatorResolver } from '@anjartiyo/giogia-semantic'

const resolver = new LocatorResolver(snapshot.elements)
const selector = resolver.resolve('login_button')
// '#login-btn' (tries: semantic-id → label → text → role → test-id → css → xpath)
```

### POM Generation
```ts
import { PageModelGenerator } from '@anjartiyo/giogia-semantic'

const gen = new PageModelGenerator()
const model = gen.generate(snapshot)
// { name: 'LoginPage', elements: [...], source: 'export class LoginPage {...}' }
```

## Install

```bash
npm install @anjartiyo/giogia-semantic
```
