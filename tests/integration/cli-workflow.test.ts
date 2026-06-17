import { describe, it, expect } from 'vitest'
import { TestRunner } from '@giogia/runner'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

function fixtureUrl(filename: string): string {
  const p = path.resolve(process.cwd(), 'tests', 'fixtures', filename)
  return pathToFileURL(p).href
}

describe('GioGia Integration Workflow', () => {
  it('captures snapshot and runs semantic test against fixture', async () => {
    const runner = new TestRunner({
      headless: true,
      outputDir: 'reports',
    })

    runner.test('Login with correct credentials', async (gio) => {
      await gio.navigate(fixtureUrl('test-app.html'))
      await gio.expect('Login').visible()
      await gio.type('email', 'admin@test.com')
      await gio.type('password', 'password')
      await gio.click('login-btn')
      await gio.expect('Dashboard loaded successfully').visible()
    })

    runner.test('Login with wrong credentials shows error', async (gio) => {
      await gio.navigate(fixtureUrl('test-app.html'))
      await gio.type('email', 'wrong@test.com')
      await gio.type('password', 'wrong')
      await gio.click('login-btn')
      await gio.expect('Invalid credentials').visible()
    })

    runner.test('Manual code escape hatch works', async (gio) => {
      await gio.navigate(fixtureUrl('test-app.html'))
      await gio.raw(async ({ page }) => {
        await page.locator('#email').fill('raw-code@test.com')
        const value = await page.locator('#email').inputValue()
        expect(value).toBe('raw-code@test.com')
      })
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(0)

    const report = runner.getReporter().generateReport()
    expect(report.total).toBe(3)
    expect(report.passed).toBe(3)
    expect(report.failed).toBe(0)
  }, 60000)

  it('runner exit code 1 when test fails', async () => {
    const runner = new TestRunner({ headless: true })

    runner.test('this will fail', async (gio) => {
      await gio.navigate(fixtureUrl('test-app.html'))
      await gio.expect('This text does not exist anywhere').visible()
    })

    const exitCode = await runner.runAll()
    expect(exitCode).toBe(1)
  }, 30000)
})
