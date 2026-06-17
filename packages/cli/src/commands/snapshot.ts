import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager, PlaywrightAdapter } from '@anjartiyo/giogia-browser'
import { SnapshotStore } from '@anjartiyo/giogia-semantic'

export function snapshotCommand(): Command {
  return new Command('snapshot <url>')
    .description('Generate semantic snapshot of a page')
    .option('-o, --output <dir>', 'Output directory', '.gio')
    .action(async (url: string, options) => {
      console.log(chalk.blue(`Capturing snapshot of ${url}...`))

      const manager = new BrowserManager()
      try {
        const session = await manager.launch(true)
        await manager.navigate(url)

        const adapter = new PlaywrightAdapter(session.page)
        const snapshot = await adapter.captureSnapshot(url)

        const store = new SnapshotStore()
        await store.save(snapshot, options.output)

        console.log(chalk.green(`✓ Snapshot saved to ${options.output}/snapshot.json`))
        console.log(`  Elements: ${snapshot.elements.length}`)
        console.log(`  Title: ${snapshot.title}`)
      } catch (error) {
        console.error(chalk.red('Snapshot failed:'), error)
        process.exit(1)
      } finally {
        await manager.close()
      }
    })
}
