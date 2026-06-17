import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@giogia/browser'

export function inspectCommand(): Command {
  return new Command('inspect <url>')
    .description('Analyze page structure and show semantic elements')
    .action(async (url: string) => {
      console.log(chalk.blue(`Inspecting ${url}...`))
      console.log('')

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        console.log(chalk.bold(`Page: ${snapshot.title}`))
        console.log(`Elements found: ${snapshot.elements.length}`)
        console.log('')

        for (const el of snapshot.elements) {
          console.log(chalk.cyan(el.id))
          console.log(`  role: ${el.role} | name: "${el.name}"`)
          if (el.selector) console.log(`  css: ${el.selector}`)
          if (el.testId) console.log(`  test-id: ${el.testId}`)
          console.log('')
        }
      } catch (error) {
        console.error(chalk.red('Inspect failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
