import { Command } from 'commander'
import chalk from 'chalk'
import { TestGenerator, ProviderRegistry } from '@giogia/ai'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function generateCommand(): Command {
  return new Command('generate <file>')
    .description('Generate tests from natural language, BDD, or markdown specs')
    .option('-o, --output <dir>', 'Output directory for tests', 'tests')
    .option('--mode <mode>', 'Input mode: natural-language, bdd', 'natural-language')
    .action(async (file: string, options) => {
      console.log(chalk.blue(`Generating tests from ${file}...`))

      const registry = new ProviderRegistry()

      try {
        if (process.env.OPENAI_API_KEY) {
          registry.configure('openai', process.env.OPENAI_API_KEY)
          registry.setActive('openai')
        } else if (process.env.ANTHROPIC_API_KEY) {
          registry.configure('anthropic', process.env.ANTHROPIC_API_KEY)
          registry.setActive('anthropic')
        } else {
          console.log(chalk.red('No AI provider configured. Run `gio ai login`.'))
          process.exit(1)
        }
      } catch (error) {
        console.log(chalk.red('AI configuration error:'), error)
        process.exit(1)
      }

      try {
        const content = await fs.readFile(file, 'utf-8')
        const generator = new TestGenerator(registry)
        const generated: any[] = []

        if (options.mode === 'bdd') {
          const scenarios = parseGherkin(content)
          for (const scenario of scenarios) {
            const result = await generator.fromBDD(scenario)
            generated.push(result)
          }
        } else {
          const blocks = content
            .split(/\n\n(?=#|[A-Z])/)
            .filter(b => b.trim().length > 0)

          for (const block of blocks) {
            const result = await generator.fromNaturalLanguage(block)
            generated.push(result)
          }
        }

        const outputDir = path.resolve(options.output)
        await fs.mkdir(outputDir, { recursive: true })

        for (const test of generated) {
          const filePath = path.join(outputDir, test.file)
          await fs.writeFile(filePath, test.content)
          console.log(chalk.green(`  ✓ ${test.file}`))
        }

        console.log('')
        console.log(chalk.green(`✓ Generated ${generated.length} test(s) in ${outputDir}/`))
      } catch (error) {
        console.error(chalk.red('Generation failed:'), error)
        process.exit(1)
      }
    })
}

function parseGherkin(content: string): Array<{
  feature: string
  scenario: string
  given: string[]
  when: string[]
  then: string[]
}> {
  const scenarios: Array<{
    feature: string
    scenario: string
    given: string[]
    when: string[]
    then: string[]
  }> = []

  let currentFeature = ''
  let current: ReturnType<typeof parseGherkin>[0] | null = null

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('Feature:')) {
      currentFeature = trimmed.replace('Feature:', '').trim()
    } else if (trimmed.startsWith('Scenario:')) {
      if (current) scenarios.push(current)
      current = {
        feature: currentFeature,
        scenario: trimmed.replace('Scenario:', '').trim(),
        given: [],
        when: [],
        then: [],
      }
    } else if (current) {
      if (trimmed.startsWith('Given ')) current.given.push(trimmed.replace('Given ', ''))
      else if (trimmed.startsWith('And ') && current.given.length > 0 && current.when.length === 0) current.given.push(trimmed.replace('And ', ''))
      else if (trimmed.startsWith('When ')) current.when.push(trimmed.replace('When ', ''))
      else if (trimmed.startsWith('And ') && current.when.length > 0) current.when.push(trimmed.replace('And ', ''))
      else if (trimmed.startsWith('Then ')) current.then.push(trimmed.replace('Then ', ''))
      else if (trimmed.startsWith('And ') && current.then.length > 0) current.then.push(trimmed.replace('And ', ''))
    }
  }

  if (current) scenarios.push(current)
  return scenarios
}
