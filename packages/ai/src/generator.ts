import type { GeneratedTest, BDDScenario } from '@giogia/core'
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
