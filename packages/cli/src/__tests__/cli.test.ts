import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'

const CLI_PATH = './dist/index.js'

describe('CLI', () => {
  it('prints help with no arguments', () => {
    const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' })
    expect(output).toContain('GioGia')
    expect(output).toContain('install')
    expect(output).toContain('doctor')
    expect(output).toContain('ai')
    expect(output).toContain('inspect')
    expect(output).toContain('snapshot')
    expect(output).toContain('explore')
    expect(output).toContain('generate')
    expect(output).toContain('test')
    expect(output).toContain('report')
  })

  it('prints version', () => {
    const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' })
    expect(output.trim()).toBe('0.1.0')
  })

  it('doctor runs without crashing', () => {
    const output = execSync(`node ${CLI_PATH} doctor`, { encoding: 'utf-8' })
    expect(output).toContain('GioGia Doctor')
  })

  it('all command modules export functions', async () => {
    const { installCommand } = await import('../commands/install.js')
    const { doctorCommand } = await import('../commands/doctor.js')
    const { aiLoginCommand } = await import('../commands/ai-login.js')
    const { aiModelCommand } = await import('../commands/ai-model.js')
    const { inspectCommand } = await import('../commands/inspect.js')
    const { snapshotCommand } = await import('../commands/snapshot.js')
    const { exploreCommand } = await import('../commands/explore.js')
    const { generateCommand } = await import('../commands/generate.js')
    const { testCommand } = await import('../commands/test.js')
    const { reportCommand } = await import('../commands/report.js')

    expect(typeof installCommand()).toBe('object')
    expect(typeof doctorCommand()).toBe('object')
    expect(typeof aiLoginCommand()).toBe('object')
    expect(typeof aiModelCommand()).toBe('object')
    expect(typeof inspectCommand()).toBe('object')
    expect(typeof snapshotCommand()).toBe('object')
    expect(typeof exploreCommand()).toBe('object')
    expect(typeof generateCommand()).toBe('object')
    expect(typeof testCommand()).toBe('object')
    expect(typeof reportCommand()).toBe('object')
  })
})
