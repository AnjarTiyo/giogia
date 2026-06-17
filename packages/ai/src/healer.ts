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
