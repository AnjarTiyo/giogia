import { Command } from 'commander'
import chalk from 'chalk'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

async function prompt(promptText: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise(resolve => {
    rl.question(promptText, (answer: string) => {
      rl.close()
      resolve(answer)
    })
  })
}

export function aiLoginCommand(): Command {
  return new Command('login')
    .description('Configure AI provider credentials')
    .option('-p, --provider <provider>', 'AI provider (openai, anthropic)', 'openai')
    .action(async (options) => {
      const provider = options.provider as string

      console.log(chalk.blue(`Configuring ${provider}...`))

      const envKey = provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : process.env.ANTHROPIC_API_KEY

      if (envKey) {
        console.log(chalk.green(`✓ Found ${provider.toUpperCase()}_API_KEY in environment`))
        return
      }

      const apiKey = await prompt(`${chalk.yellow(`Enter your ${provider} API key:`)} `)

      if (!apiKey.trim()) {
        console.log(chalk.red('No API key provided.'))
        return
      }

      const envPath = path.join(process.cwd(), '.env')
      const envVarName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
      const line = `\n${envVarName}=${apiKey.trim()}\n`

      try {
        await fs.appendFile(envPath, line)
        console.log(chalk.green(`✓ API key saved to .env`))
        console.log(chalk.yellow('⚠ Restart your terminal or source .env to use it.'))
      } catch (error) {
        console.error(chalk.red('Failed to save API key:'), error)
      }
    })
}
