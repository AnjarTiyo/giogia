import { Command } from 'commander'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function testCommand(): Command {
  return new Command('test')
    .description('Execute tests deterministically')
    .option('-d, --dir <dir>', 'Test directory', 'tests')
    .option('--headless', 'Run headless', true)
    .action(async (options) => {
      console.log(chalk.blue('Running tests...'))
      console.log('')

      const testDir = path.resolve(options.dir)

      try {
        await fs.access(testDir)
      } catch {
        console.log(chalk.yellow(`No tests directory found at ${testDir}`))
        console.log('Create test files or run `gio generate` to create tests.')
        process.exit(0)
      }

      const files = await fs.readdir(testDir)
      const specFiles = files.filter(f => f.endsWith('.spec.ts') || f.endsWith('.spec.js'))

      if (specFiles.length === 0) {
        console.log(chalk.yellow('No test files found.'))
        process.exit(0)
      }

      let totalPassed = 0
      let totalFailed = 0

      for (const file of specFiles) {
        const filePath = path.join(testDir, file)
        console.log(`  ${chalk.cyan(file)}`)

        try {
          const fileUrl = pathToFileURL(filePath).href
          await import(fileUrl)
          console.log(chalk.green(`    ✓ PASS`))
          totalPassed++
        } catch (error) {
          console.log(chalk.red(`    ✗ FAIL`))
          if (error instanceof Error) {
            console.log(chalk.red(`      ${error.message}`))
          }
          totalFailed++
        }
      }

      console.log('')
      console.log(chalk.bold('Results:'))
      console.log(chalk.green(`  Passed: ${totalPassed}`))
      console.log(chalk.red(`  Failed: ${totalFailed}`))
      console.log(`  Total: ${totalPassed + totalFailed}`)

      process.exit(totalFailed > 0 ? 1 : 0)
    })
}
