import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { AI_BASE_URL, aiClient } from './api/aiClient'
import type {
  BuildIndexResponse,
  GenerateChecklistResponse,
  HealthResponse,
  IngestResponse,
  VerifyChecklistResponse,
} from './types/pipeline'

type LoadingKey = 'health' | 'ingest' | 'index' | 'generate' | 'verify'

type LoadingState = Record<LoadingKey, boolean>

const initialLoadingState: LoadingState = {
  health: false,
  ingest: false,
  index: false,
  generate: false,
  verify: false,
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error occurred.'
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function App() {
  const [manualId, setManualId] = useState('newiomanual')
  const [manualName, setManualName] = useState('newiomanual')
  const [filePath, setFilePath] = useState('')
  const [chunkSizePages, setChunkSizePages] = useState(3)
  const [objective, setObjective] = useState('Extract preventive and safety maintenance checklist')
  const [maxItems, setMaxItems] = useState(20)
  const [strictCitations, setStrictCitations] = useState(true)
  const [verifyChecklistId, setVerifyChecklistId] = useState('')

  const [loading, setLoading] = useState<LoadingState>(initialLoadingState)
  const [errorMessage, setErrorMessage] = useState('')

  const [healthResponse, setHealthResponse] = useState<HealthResponse | null>(null)
  const [ingestResponse, setIngestResponse] = useState<IngestResponse | null>(null)
  const [indexResponse, setIndexResponse] = useState<BuildIndexResponse | null>(null)
  const [generateResponse, setGenerateResponse] = useState<GenerateChecklistResponse | null>(null)
  const [verifyResponse, setVerifyResponse] = useState<VerifyChecklistResponse | null>(null)

  const setBusy = (key: LoadingKey, value: boolean) => {
    setLoading((previous) => ({ ...previous, [key]: value }))
  }

  const runHealth = async () => {
    setErrorMessage('')
    setBusy('health', true)
    try {
      const response = await aiClient.health()
      setHealthResponse(response)
    } catch (error) {
      setErrorMessage(formatError(error))
    } finally {
      setBusy('health', false)
    }
  }

  const runIngest = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setBusy('ingest', true)
    try {
      const response = await aiClient.ingest({
        manual_id: manualId.trim(),
        manual_name: manualName.trim(),
        file_path: filePath.trim(),
      })
      setIngestResponse(response)
    } catch (error) {
      setErrorMessage(formatError(error))
    } finally {
      setBusy('ingest', false)
    }
  }

  const runBuildIndex = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setBusy('index', true)
    try {
      const response = await aiClient.buildIndex({
        manual_id: manualId.trim(),
        chunk_size_pages: chunkSizePages,
      })
      setIndexResponse(response)
    } catch (error) {
      setErrorMessage(formatError(error))
    } finally {
      setBusy('index', false)
    }
  }

  const runGenerate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setBusy('generate', true)
    try {
      const response = await aiClient.generate({
        manual_id: manualId.trim(),
        objective: objective.trim(),
        max_items: maxItems,
        strict_citations: strictCitations,
      })
      setGenerateResponse(response)
      setVerifyChecklistId(response.checklist_id)
    } catch (error) {
      setErrorMessage(formatError(error))
    } finally {
      setBusy('generate', false)
    }
  }

  const runVerify = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setBusy('verify', true)
    try {
      const response = await aiClient.verify({
        manual_id: manualId.trim(),
        checklist_id: verifyChecklistId.trim() || generateResponse?.checklist_id,
        strict_citations: strictCitations,
      })
      setVerifyResponse(response)
    } catch (error) {
      setErrorMessage(formatError(error))
    } finally {
      setBusy('verify', false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="eyebrow">Manual Checklist Builder</div>
        <h1>AI Pipeline MVP Console</h1>
        <p>
          Temporary direct wiring from React to FastAPI. Run ingest, index, generate, and verify before
          switching to Express orchestration.
        </p>
        <div className="hero-meta">
          <span className="chip">AI Base URL: {AI_BASE_URL}</span>
          <button className="button ghost" onClick={runHealth} type="button" disabled={loading.health}>
            {loading.health ? 'Checking...' : 'Check /health'}
          </button>
        </div>
      </section>

      {errorMessage && (
        <section className="alert error" role="alert">
          {errorMessage}
        </section>
      )}

      {healthResponse && (
        <section className="alert success" role="status">
          FastAPI is up: {healthResponse.service} at {healthResponse.timestamp}
        </section>
      )}

      <section className="grid">
        <article className="card">
          <div className="card-header">
            <h2>Step 1 - Ingest PDF</h2>
            <span className="chip">{ingestResponse ? 'Done' : 'Pending'}</span>
          </div>
          <form className="stack" onSubmit={runIngest}>
            <label className="field">
              <span>Manual ID</span>
              <input value={manualId} onChange={(event) => setManualId(event.target.value)} required />
            </label>
            <label className="field">
              <span>Manual Name</span>
              <input value={manualName} onChange={(event) => setManualName(event.target.value)} required />
            </label>
            <label className="field">
              <span>PDF Absolute Path</span>
              <input
                value={filePath}
                onChange={(event) => setFilePath(event.target.value)}
                placeholder="C:/Users/.../test_manuals/manual.pdf"
                required
              />
            </label>
            <button className="button" type="submit" disabled={loading.ingest}>
              {loading.ingest ? 'Ingesting...' : 'Run /v1/ingest'}
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Step 2 - Build Index</h2>
            <span className="chip">{indexResponse ? 'Done' : 'Pending'}</span>
          </div>
          <form className="stack" onSubmit={runBuildIndex}>
            <label className="field">
              <span>Chunk Size (Pages)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={chunkSizePages}
                onChange={(event) => setChunkSizePages(Number(event.target.value))}
                required
              />
            </label>
            <button className="button" type="submit" disabled={loading.index}>
              {loading.index ? 'Building...' : 'Run /v1/pageindex/build'}
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Step 3 - Generate Checklist</h2>
            <span className="chip">{generateResponse ? 'Done' : 'Pending'}</span>
          </div>
          <form className="stack" onSubmit={runGenerate}>
            <label className="field">
              <span>Objective</span>
              <textarea value={objective} onChange={(event) => setObjective(event.target.value)} rows={3} />
            </label>
            <label className="field">
              <span>Max Items</span>
              <input
                type="number"
                min={1}
                max={100}
                value={maxItems}
                onChange={(event) => setMaxItems(Number(event.target.value))}
                required
              />
            </label>
            <label className="inline-field">
              <input
                type="checkbox"
                checked={strictCitations}
                onChange={(event) => setStrictCitations(event.target.checked)}
              />
              <span>Strict citations</span>
            </label>
            <button className="button" type="submit" disabled={loading.generate}>
              {loading.generate ? 'Generating...' : 'Run /v1/checklist/generate'}
            </button>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h2>Step 4 - Verify Checklist</h2>
            <span className="chip">{verifyResponse ? 'Done' : 'Pending'}</span>
          </div>
          <form className="stack" onSubmit={runVerify}>
            <label className="field">
              <span>Checklist ID</span>
              <input
                value={verifyChecklistId}
                onChange={(event) => setVerifyChecklistId(event.target.value)}
                placeholder="Auto-filled after generate"
              />
            </label>
            <button className="button" type="submit" disabled={loading.verify}>
              {loading.verify ? 'Verifying...' : 'Run /v1/checklist/verify'}
            </button>
          </form>
        </article>
      </section>

      {generateResponse && (
        <section className="card preview">
          <div className="card-header">
            <h2>Checklist Preview</h2>
            <span className="chip">{generateResponse.item_count} items</span>
          </div>
          <div className="preview-grid">
            {generateResponse.items.slice(0, 8).map((item) => (
              <article key={item.item_id} className="item">
                <div className="item-top">
                  <span className={`pill ${item.priority === 'must_do' ? 'must' : 'optional'}`}>
                    {item.priority}
                  </span>
                  <span className="pill neutral">p.{item.evidence.page_number}</span>
                </div>
                <h3>{item.text}</h3>
                <p>{item.evidence.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid">
        <article className="card response">
          <h2>Ingest Response</h2>
          <pre>{ingestResponse ? pretty(ingestResponse) : 'Run ingest to view response.'}</pre>
        </article>
        <article className="card response">
          <h2>Index Response</h2>
          <pre>{indexResponse ? pretty(indexResponse) : 'Run build index to view response.'}</pre>
        </article>
        <article className="card response">
          <h2>Generate Response</h2>
          <pre>{generateResponse ? pretty(generateResponse) : 'Run generate to view response.'}</pre>
        </article>
        <article className="card response">
          <h2>Verify Response</h2>
          <pre>{verifyResponse ? pretty(verifyResponse) : 'Run verify to view response.'}</pre>
        </article>
      </section>
    </main>
  )
}

export default App
