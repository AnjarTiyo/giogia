import { Command } from 'commander'
import chalk from 'chalk'
import { execSync } from 'node:child_process'

export function installCommand(): Command {
  return new Command('install')
    .description('Install GioGia runtime and browser dependencies')
    .action(async () => {
      console.log(chalk.blue('Installing GioGia...'))

      try {
        console.log('  Installing Playwright browsers...')
        execSync('npx playwright install chromium', { stdio: 'inherit' })
        console.log(chalk.green('✓ Chromium installed'))

        console.log('')
        console.log(chalk.green('✓ GioGia installed successfully'))
        console.log('')
        console.log('Next steps:')
        console.log(`  ${chalk.cyan('giogia doctor')} - validate environment`)
        console.log(`  ${chalk.cyan('giogia ai login')} - configure AI provider`)
      } catch (error) {
        console.error(chalk.red('Installation failed:'), error)
        process.exit(1)
      }
    })
}
