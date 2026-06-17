import { Command } from 'commander'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export function reportCommand(): Command {
  return new Command('report')
    .description('Generate execution report from latest test run')
    .option('-o, --output <dir>', 'Output directory', 'reports')
    .action(async (options) => {
      console.log(chalk.blue('Generating report...'))

      const reportDir = path.resolve(options.output)
      const indexPath = path.join(reportDir, 'index.html')

      try {
        await fs.access(indexPath)
        console.log(chalk.green(`✓ Report available at ${indexPath}`))
        console.log('')
        console.log(`Open with: ${chalk.cyan(`open ${indexPath}`)}`)
      } catch {
        console.log(chalk.yellow(`No report found at ${indexPath}`))
        console.log(`Run ${chalk.cyan('gio test')} first to generate results.`)
      }
    })
}
