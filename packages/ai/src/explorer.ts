import type { PageSnapshot, ExploratoryReport, DiscoveredFlow } from '@anjartiyo/giogia-core'
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
