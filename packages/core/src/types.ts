/** Unique semantic identifier for a page element */
export type SemanticId = string

/** Roles an element can play (ARIA-inspired) */
export type ElementRole =
  | 'button'
  | 'link'
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'combobox'
  | 'heading'
  | 'image'
  | 'list'
  | 'listitem'
  | 'navigation'
  | 'dialog'
  | 'alert'
  | 'generic'

/** A semantic snapshot entry describing one interactive element */
export interface SemanticElement {
  /** Stable semantic ID (e.g., "login_button") */
  id: SemanticId
  /** ARIA / inferred role */
  role: ElementRole
  /** Visible text or aria-label */
  name: string
  /** CSS selector (fallback) */
  selector: string | null
  /** test-id attribute (fallback) */
  testId: string | null
  /** XPath (last resort fallback) */
  xpath: string | null
  /** Additional metadata */
  attributes: Record<string, string>
}

/** Full page snapshot */
export interface PageSnapshot {
  /** Source URL */
  url: string
  /** Capture timestamp */
  capturedAt: string
  /** Page title */
  title: string
  /** All semantic elements found */
  elements: SemanticElement[]
}

/** Locator resolution strategy ordered by priority */
export type LocatorStrategy =
  | 'semantic-id'
  | 'role'
  | 'label'
  | 'text'
  | 'test-id'
  | 'css'
  | 'xpath'

/** Options for resolving a semantic locator */
export interface ResolveOptions {
  /** Override resolution strategy order */
  strategies?: LocatorStrategy[]
  /** Timeout in ms */
  timeout?: number
}

/** AI provider identifier */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'ollama'

/** AI model configuration */
export interface AIModelConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseURL?: string
}

/** Single discovered workflow from exploratory testing */
export interface DiscoveredFlow {
  name: string
  steps: string[]
  url: string
}

/** Exploratory test report */
export interface ExploratoryReport {
  url: string
  exploredAt: string
  flows: DiscoveredFlow[]
  potentialIssues: string[]
  suggestedTests: string[]
}

/** BDD scenario parsed from Gherkin */
export interface BDDScenario {
  feature: string
  scenario: string
  given: string[]
  when: string[]
  then: string[]
}

/** Supported test authoring modes */
export type TestMode = 'natural-language' | 'bdd' | 'semantic-dsl' | 'manual-code'

/** Single generated test */
export interface GeneratedTest {
  name: string
  file: string
  content: string
  mode: TestMode
}

/** Test execution result */
export interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  screenshot?: string
  trace?: string
  video?: string
}

/** Full test run report */
export interface TestReport {
  total: number
  passed: number
  failed: number
  duration: number
  results: TestResult[]
  generatedAt: string
}
