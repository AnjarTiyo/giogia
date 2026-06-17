import { describe, it, expect } from 'vitest'
import { TestRunner } from '../runner.js'

describe('TestRunner', () => {
  it('executes passing test and returns exit code 0', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('simple navigation', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)
  }, 15000)

  it('executes failing test and returns exit code 1', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('failing assertion', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('This Text Does Not Exist On The Page').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(1)
  }, 20000)

  it('executes multiple tests and reports all', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('passing', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    runner.test('also passing', async (gio) => {
      await gio.navigate('https://example.com')
      await gio.expect('Example Domain').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)

    const report = runner.getReporter().generateReport()
    expect(report.total).toBe(2)
    expect(report.passed).toBe(2)
  }, 20000)
})
