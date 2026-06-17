import type { TestReport, TestResult } from '@anjartiyo/giogia-core'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export class Reporter {
  private results: TestResult[] = []
  private startTime: number = 0

  start(): void {
    this.startTime = Date.now()
    this.results = []
  }

  record(result: TestResult): void {
    this.results.push(result)
  }

  generateReport(): TestReport {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      duration: Date.now() - this.startTime,
      results: this.results,
      generatedAt: new Date().toISOString(),
    }
  }

  async writeHtmlReport(report: TestReport, dir = 'reports'): Promise<string> {
    await fs.mkdir(dir, { recursive: true })

    const html = this.buildHtml(report)
    const filePath = path.join(dir, 'index.html')
    await fs.writeFile(filePath, html)

    return filePath
  }

  private buildHtml(report: TestReport): string {
    const passRate = report.total > 0
      ? ((report.passed / report.total) * 100).toFixed(1)
      : '0'

    const rows = report.results
      .map(
        r => `
      <tr class="${r.passed ? 'pass' : 'fail'}">
        <td>${r.passed ? '✓' : '✗'}</td>
        <td>${r.name}</td>
        <td>${r.duration}ms</td>
        <td>${r.error ? `<pre>${r.error}</pre>` : ''}</td>
      </tr>`
      )
      .join('')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GioGia Test Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 40px auto; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .summary div { padding: 20px; border-radius: 8px; min-width: 120px; text-align: center; }
    .total { background: #e8f0fe; }
    .passed { background: #e6f4ea; color: #137333; }
    .failed { background: #fce8e6; color: #c5221f; }
    .duration { background: #fef7e0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    .pass { background: #f6fff6; }
    .fail { background: #fff6f6; }
    pre { font-size: 12px; color: #c5221f; margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>GioGia Test Report</h1>
  <div class="summary">
    <div class="total"><strong>${report.total}</strong><br>Total</div>
    <div class="passed"><strong>${report.passed}</strong><br>Passed</div>
    <div class="failed"><strong>${report.failed}</strong><br>Failed</div>
    <div class="duration"><strong>${(report.duration / 1000).toFixed(1)}s</strong><br>Duration</div>
    <div><strong>${passRate}%</strong><br>Pass Rate</div>
  </div>
  <table>
    <thead>
      <tr><th></th><th>Test</th><th>Duration</th><th>Error</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="color:#999;margin-top:30px">Generated: ${report.generatedAt}</p>
</body>
</html>`
  }
}
