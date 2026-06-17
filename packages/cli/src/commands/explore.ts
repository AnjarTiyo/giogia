import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@anjartiyo/giogia-browser'
import { Explorer, ProviderRegistry } from '@anjartiyo/giogia-ai'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function exploreCommand(): Command {
  return new Command('explore <url>')
    .description('AI-driven exploratory testing of a page')
    .option('-o, --output <dir>', 'Output directory', '.gio')
    .action(async (url: string, options) => {
      console.log(chalk.blue(`Exploring ${url} with AI...`))

      const registry = new ProviderRegistry()

      try {
        const aiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
        if (!aiKey) {
          console.log(chalk.red('No AI provider configured.'))
          console.log(`Run ${chalk.cyan('giogia ai login')} first.`)
          process.exit(1)
        }

        if (process.env.OPENAI_API_KEY) {
          registry.configure('openai', process.env.OPENAI_API_KEY)
          registry.setActive('openai')
        } else if (process.env.ANTHROPIC_API_KEY) {
          registry.configure('anthropic', process.env.ANTHROPIC_API_KEY)
          registry.setActive('anthropic')
        }
      } catch (error) {
        console.log(chalk.red('AI configuration error:'), error)
        process.exit(1)
      }

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        console.log(`  Page: ${snapshot.title}`)
        console.log(`  Elements found: ${snapshot.elements.length}`)
        console.log('')
        console.log(chalk.blue('Exploring with AI...'))

        const explorer = new Explorer(registry)
        const report = await explorer.explore(snapshot)

        await fs.mkdir(options.output, { recursive: true })

        const reportPath = path.join(options.output, 'exploratory-report.md')
        const flowsPath = path.join(options.output, 'discovered-flows.json')
        const testsPath = path.join(options.output, 'suggested-tests.md')

        let md = `# Exploratory Report: ${url}\n\n`
        md += `**Date:** ${report.exploredAt}\n\n`
        md += `## Discovered Flows\n\n`
        for (const flow of report.flows) {
          md += `### ${flow.name}\n\n`
          for (const step of flow.steps) {
            md += `- ${step}\n`
          }
          md += '\n'
        }
        md += `## Potential Issues\n\n`
        for (const issue of report.potentialIssues) {
          md += `- ⚠ ${issue}\n`
        }
        await fs.writeFile(reportPath, md)

        await fs.writeFile(flowsPath, JSON.stringify(report.flows, null, 2))
        await fs.writeFile(testsPath, report.suggestedTests.map(t => `- ${t}`).join('\n'))

        console.log('')
        console.log(chalk.green('✓ Exploration complete'))

        console.log('')
        console.log(chalk.bold('Discovered Flows:'))
        for (const flow of report.flows) {
          console.log(`  ${chalk.green('✓')} ${flow.name}`)
        }
        if (report.potentialIssues.length > 0) {
          console.log('')
          console.log(chalk.bold('Potential Issues:'))
          for (const issue of report.potentialIssues) {
            console.log(`  ${chalk.yellow('⚠')} ${issue}`)
          }
        }
        console.log('')
        console.log(`Reports saved to ${options.output}/`)

      } catch (error) {
        console.error(chalk.red('Exploration failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
