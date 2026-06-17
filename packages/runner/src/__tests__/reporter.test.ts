import { describe, it, expect, beforeEach } from 'vitest'
import { Reporter } from '../reporter.js'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('Reporter', () => {
  let reporter: Reporter
  let tmpDir: string

  beforeEach(async () => {
    reporter = new Reporter()
    tmpDir = path.join(os.tmpdir(), `giogia-reporter-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })
  })

  it('records test results and generates report', () => {
    reporter.start()

    reporter.record({ name: 'test1', passed: true, duration: 10 })
    reporter.record({ name: 'test2', passed: false, duration: 20, error: 'expected A got B' })

    const report = reporter.generateReport()
    expect(report.total).toBe(2)
    expect(report.passed).toBe(1)
    expect(report.failed).toBe(1)
  })

  it('generates HTML report file', async () => {
    reporter.start()
    reporter.record({ name: 'login test', passed: true, duration: 42 })

    const report = reporter.generateReport()
    const filePath = await reporter.writeHtmlReport(report, path.join(tmpDir, 'reports'))

    expect(filePath).toContain('index.html')

    const content = await fs.readFile(filePath, 'utf-8')
    expect(content).toContain('GioGia Test Report')
    expect(content).toContain('login test')
    expect(content).toContain('42ms')
  })
})
