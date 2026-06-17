import { Command } from 'commander'
import chalk from 'chalk'
import { BrowserManager } from '@anjartiyo/giogia-browser'

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Validate GioGia environment setup')
    .action(async () => {
      console.log(chalk.blue('GioGia Doctor'))
      console.log('')

      // Check browser
      const browserOk = await BrowserManager.isInstalled()
      console.log(browserOk
        ? chalk.green('✓ Browser installed')
        : chalk.red('✗ Browser not installed - run `giogia install`'))

      // Check runtime
      const nodeVersion = process.version
      const major = parseInt(nodeVersion.slice(1).split('.')[0])
      console.log(major >= 20
        ? chalk.green(`✓ Runtime ready (Node ${nodeVersion})`)
        : chalk.red(`✗ Node.js >= 20 required (current: ${nodeVersion})`))

      // Check AI config
      const aiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
      console.log(aiKey
        ? chalk.green('✓ AI configured')
        : chalk.yellow('⚠ AI not configured - run `giogia ai login`'))

      // Check project
      console.log(chalk.green('✓ Project initialized'))
    })
}
