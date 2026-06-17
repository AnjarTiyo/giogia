import { BrowserManager } from '@anjartiyo/giogia-browser'
import type { TestResult } from '@anjartiyo/giogia-core'
import { GioDSL } from './gio-dsl.js'
import { Reporter } from './reporter.js'

export interface TestDefinition {
  name: string
  fn: (gio: GioDSL) => Promise<void>
}

export interface RunnerConfig {
  headless?: boolean
  baseUrl?: string
  outputDir?: string
}

export class TestRunner {
  private browserManager: BrowserManager
  private reporter: Reporter
  private tests: TestDefinition[] = []
  private config: RunnerConfig

  constructor(config: RunnerConfig = {}) {
    this.config = { headless: true, outputDir: 'reports', ...config }
    this.browserManager = new BrowserManager()
    this.reporter = new Reporter()
  }

  test(name: string, fn: (gio: GioDSL) => Promise<void>): void {
    this.tests.push({ name, fn })
  }

  async runAll(): Promise<number> {
    this.reporter.start()

    for (const testDef of this.tests) {
      const result = await this.runOne(testDef)
      this.reporter.record(result)
    }

    const report = this.reporter.generateReport()
    await this.reporter.writeHtmlReport(report, this.config.outputDir)

    return report.failed > 0 ? 1 : 0
  }

  private async runOne(testDef: TestDefinition): Promise<TestResult> {
    const start = Date.now()

    try {
      const session = await this.browserManager.launch(this.config.headless)
      const gio = new GioDSL(session.page)

      try {
        await testDef.fn(gio)
        return {
          name: testDef.name,
          passed: true,
          duration: Date.now() - start,
        }
      } finally {
        await this.browserManager.close()
      }
    } catch (error) {
      return {
        name: testDef.name,
        passed: false,
        duration: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  getReporter(): Reporter {
    return this.reporter
  }
}
