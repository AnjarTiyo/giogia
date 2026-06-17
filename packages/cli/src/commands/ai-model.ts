import { Command } from 'commander'
import chalk from 'chalk'
import { ProviderRegistry } from '@anjartiyo/giogia-ai'

export function aiModelCommand(): Command {
  return new Command('model')
    .description('Select active AI model')
    .option('-p, --provider <provider>', 'AI provider', 'openai')
    .option('-m, --model <model>', 'Model name')
    .action(async (options) => {
      const registry = new ProviderRegistry()

      if (options.model) {
        registry.setModel(options.provider, options.model)
        console.log(chalk.green(`✓ Model set to ${options.model} for ${options.provider}`))
        return
      }

      console.log(chalk.blue(`Current Provider: ${registry.getActive()}`))
      console.log('')
      console.log('Available Models:')
      console.log('')
      console.log('  1. gpt-4o')
      console.log('  2. gpt-4o-mini')
      console.log('  3. gpt-4-turbo')
      console.log('')
      console.log(`Current: ${registry.getModel()}`)
      console.log('')
      console.log(`Run ${chalk.cyan('gio ai model -m <model>')} to change`)
    })
}
