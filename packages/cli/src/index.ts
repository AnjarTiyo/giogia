#!/usr/bin/env node
import { Command } from 'commander'
import { installCommand } from './commands/install.js'
import { doctorCommand } from './commands/doctor.js'
import { aiLoginCommand } from './commands/ai-login.js'
import { aiModelCommand } from './commands/ai-model.js'
import { inspectCommand } from './commands/inspect.js'
import { snapshotCommand } from './commands/snapshot.js'
import { exploreCommand } from './commands/explore.js'
import { generateCommand } from './commands/generate.js'
import { testCommand } from './commands/test.js'
import { reportCommand } from './commands/report.js'

const program = new Command()

program
  .name('giogia')
  .description('GioGia - AI-first web test automation framework')
  .version('0.1.0')

program.addCommand(installCommand())
program.addCommand(doctorCommand())

const ai = new Command('ai').description('AI provider management')
ai.addCommand(aiLoginCommand())
ai.addCommand(aiModelCommand())
program.addCommand(ai)

program.addCommand(inspectCommand())
program.addCommand(snapshotCommand())
program.addCommand(exploreCommand())
program.addCommand(generateCommand())
program.addCommand(testCommand())
program.addCommand(reportCommand())

program.parse()
