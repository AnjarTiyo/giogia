import { describe, it, expect, beforeEach } from 'vitest'
import { SnapshotStore } from '../snapshot-store.js'
import type { PageSnapshot } from '@giogia/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

describe('SnapshotStore', () => {
  let store: SnapshotStore
  let tmpDir: string

  const sampleSnapshot: PageSnapshot = {
    url: 'https://example.com/login',
    capturedAt: '2025-06-17T00:00:00Z',
    title: 'Login Page',
    elements: [
      { id: 'email_input', role: 'textbox', name: 'Email', selector: '#email', testId: null, xpath: null, attributes: {} },
      { id: 'password_input', role: 'textbox', name: 'Password', selector: '#password', testId: null, xpath: null, attributes: {} },
      { id: 'login_button', role: 'button', name: 'Login', selector: '#login-btn', testId: 'login-button', xpath: null, attributes: {} },
    ],
  }

  beforeEach(async () => {
    store = new SnapshotStore()
    tmpDir = path.join(os.tmpdir(), `giogia-test-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })
  })

  it('saves and loads snapshot to/from disk', async () => {
    await store.save(sampleSnapshot, tmpDir)

    const filePath = path.join(tmpDir, 'snapshot.json')
    const exists = await fs.stat(filePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    const loaded = await store.load(filePath)
    expect(loaded.url).toBe('https://example.com/login')
    expect(loaded.elements).toHaveLength(3)
  })

  it('get returns snapshot by URL after load', async () => {
    store = new SnapshotStore()
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    const found = store.get('https://example.com/login')
    expect(found).toBeDefined()
    expect(found!.title).toBe('Login Page')
  })

  it('findElement locates element by semantic id', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    const el = store.findElement('login_button')
    expect(el).toBeDefined()
    expect(el!.role).toBe('button')
    expect(el!.name).toBe('Login')
  })

  it('findElement returns undefined for missing id', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    expect(store.findElement('nonexistent')).toBeUndefined()
  })

  it('listUrls returns all loaded snapshot URLs', async () => {
    await store.save(sampleSnapshot, tmpDir)
    const filePath = path.join(tmpDir, 'snapshot.json')
    await store.load(filePath)

    expect(store.listUrls()).toContain('https://example.com/login')
  })
})
