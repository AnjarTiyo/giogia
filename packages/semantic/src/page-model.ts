import type { PageSnapshot, SemanticElement } from '@giogia/core'

export interface PageModelClass {
  name: string
  elements: PageModelElement[]
  source: string
}

export interface PageModelElement {
  name: string
  semanticId: string
  role: string
  type: string
}

export class PageModelGenerator {
  /**
   * Generate a TypeScript Page Object Model class from a snapshot
   */
  generate(snapshot: PageSnapshot): PageModelClass {
    const name = this.toPascalCase(this.urlToName(snapshot.url)) + 'Page'
    const elements = snapshot.elements.map(el => ({
      name: this.toCamelCase(el.id),
      semanticId: el.id,
      role: el.role,
      type: this.elementType(el),
    }))

    const source = this.buildClassSource(name, elements)

    return { name, elements, source }
  }

  private buildClassSource(className: string, elements: PageModelElement[]): string {
    const lines: string[] = [
      `import { gio } from '@giogia/semantic'`,
      '',
      `export class ${className} {`,
    ]

    for (const el of elements) {
      const escapedId = el.semanticId.replace(/'/g, "\\'")
      lines.push(`  ${el.name} = gio.element('${escapedId}')`)
    }

    lines.push('}')
    lines.push('')
    return lines.join('\n')
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[^a-zA-Z0-9]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('')
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private urlToName(url: string): string {
    try {
      const { hostname, pathname } = new URL(url)
      const parts = pathname.split('/').filter(Boolean)
      return parts[parts.length - 1] || hostname.replace(/\./g, '_')
    } catch {
      return 'Page'
    }
  }

  private elementType(el: SemanticElement): string {
    if (el.role === 'button') return 'ButtonElement'
    if (el.role === 'textbox') return 'InputElement'
    if (el.role === 'checkbox') return 'CheckboxElement'
    if (el.role === 'link') return 'LinkElement'
    return 'Element'
  }
}
