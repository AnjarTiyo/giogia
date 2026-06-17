import type { PageSnapshot, SemanticElement } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'

export class SnapshotStore {
  private snapshots: Map<string, PageSnapshot> = new Map()

  /** Load snapshot from disk (.gio/snapshot.json) */
  async load(filePath: string): Promise<PageSnapshot> {
    const raw = await fs.readFile(filePath, 'utf-8')
    const snapshot: PageSnapshot = JSON.parse(raw)
    this.snapshots.set(snapshot.url, snapshot)
    return snapshot
  }

  /** Save snapshot to disk */
  async save(snapshot: PageSnapshot, dir = '.gio'): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, 'snapshot.json')
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2))
    this.snapshots.set(snapshot.url, snapshot)
  }

  /** Get loaded snapshot by URL */
  get(url: string): PageSnapshot | undefined {
    return this.snapshots.get(url)
  }

  /** Find element by semantic id across all loaded snapshots */
  findElement(id: string): SemanticElement | undefined {
    for (const snapshot of this.snapshots.values()) {
      const el = snapshot.elements.find(e => e.id === id)
      if (el) return el
    }
    return undefined
  }

  /** List all URLs with loaded snapshots */
  listUrls(): string[] {
    return Array.from(this.snapshots.keys())
  }

  clear(): void {
    this.snapshots.clear()
  }
}
