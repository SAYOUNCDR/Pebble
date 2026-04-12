import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { API_BASE_URL, backendClient } from './api/backendClient'
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

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200'

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'

function App() {
  const [manualId, setManualId] = useState('newiomanual')
  const [manualName, setManualName] = useState('newiomanual')
  const [filePath, setFilePath] = useState('')
  const [chunkSizePages, setChunkSizePages] = useState(3)
  const [indexProvider, setIndexProvider] = useState<'local' | 'pageindex'>('local')
  const [forceRebuild, setForceRebuild] = useState(false)
  const [objective, setObjective] = useState('Extract preventive and safety maintenance checklist')
  const [maxItems, setMaxItems] = useState(20)
  const [strictCitations, setStrictCitations] = useState(true)
  const [retrievalMode, setRetrievalMode] = useState<'heuristic' | 'tree_search'>('heuristic')
  const [expertRules, setExpertRules] = useState('')
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
      const response = await backendClient.health()
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
      const response = await backendClient.ingest({
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
      const response = await backendClient.buildIndex({
        manual_id: manualId.trim(),
        chunk_size_pages: chunkSizePages,
        provider: indexProvider,
        force_rebuild: forceRebuild,
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
      const response = await backendClient.generate({
        manual_id: manualId.trim(),
        objective: objective.trim(),
        max_items: maxItems,
        strict_citations: strictCitations,
        retrieval_mode: retrievalMode,
        expert_rules: expertRules.trim() || undefined,
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
      const response = await backendClient.verify({
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto grid w-full max-w-6xl gap-4">
        <section className="rounded-3xl border border-slate-200 bg-linear-to-b from-white to-slate-100 p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Manual Checklist Builder</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Pipeline MVP Console</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            React now talks to Express only. Express proxies AI pipeline calls to FastAPI for ingest, index,
            generate, and verify.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
              API Base URL: {API_BASE_URL}
            </span>
            <button
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={runHealth}
              type="button"
              disabled={loading.health}
            >
              {loading.health ? 'Checking...' : 'Check /health'}
            </button>
          </div>
        </section>

        {errorMessage && (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {errorMessage}
          </section>
        )}

        {healthResponse && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
            Service is up: {healthResponse.service} at {healthResponse.timestamp}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Step 1 - Ingest PDF</h2>
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {ingestResponse ? 'Done' : 'Pending'}
              </span>
            </div>
            <form className="grid gap-3" onSubmit={runIngest}>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Manual ID</span>
                <input className={inputClass} value={manualId} onChange={(event) => setManualId(event.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Manual Name</span>
                <input className={inputClass} value={manualName} onChange={(event) => setManualName(event.target.value)} required />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">PDF Absolute Path</span>
                <input
                  className={inputClass}
                  value={filePath}
                  onChange={(event) => setFilePath(event.target.value)}
                  placeholder="C:/Users/.../test_manuals/manual.pdf"
                  required
                />
              </label>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading.ingest}
              >
                {loading.ingest ? 'Ingesting...' : 'Run /api/ai/ingest'}
              </button>
            </form>
          </article>

          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Step 2 - Build Index</h2>
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {indexResponse ? `Done (${indexResponse.provider})` : `Pending (${indexProvider})`}
              </span>
            </div>
            <form className="grid gap-3" onSubmit={runBuildIndex}>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Index Provider</span>
                <select
                  className={inputClass}
                  value={indexProvider}
                  onChange={(event) => setIndexProvider(event.target.value as 'local' | 'pageindex')}
                >
                  <option value="local">local (heuristic sections)</option>
                  <option value="pageindex">pageindex (cloud tree)</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Chunk Size (Pages)</span>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={30}
                  value={chunkSizePages}
                  onChange={(event) => setChunkSizePages(Number(event.target.value))}
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  className="h-4 w-4 rounded border-slate-300"
                  type="checkbox"
                  checked={forceRebuild}
                  onChange={(event) => setForceRebuild(event.target.checked)}
                />
                <span>Force re-upload/rebuild in PageIndex</span>
              </label>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading.index}
              >
                {loading.index ? 'Building...' : 'Run /api/ai/pageindex/build'}
              </button>
            </form>
          </article>

          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Step 3 - Generate Checklist</h2>
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {generateResponse ? `Done (${generateResponse.retrieval_mode})` : `Pending (${retrievalMode})`}
              </span>
            </div>
            <form className="grid gap-3" onSubmit={runGenerate}>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Retrieval Mode</span>
                <select
                  className={inputClass}
                  value={retrievalMode}
                  onChange={(event) => setRetrievalMode(event.target.value as 'heuristic' | 'tree_search')}
                >
                  <option value="heuristic">heuristic (rank sections)</option>
                  <option value="tree_search">tree_search (LLM routes node_ids)</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Objective</span>
                <textarea
                  className={inputClass}
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  rows={3}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Expert Rules (optional)</span>
                <textarea
                  className={inputClass}
                  value={expertRules}
                  onChange={(event) => setExpertRules(event.target.value)}
                  rows={4}
                  placeholder="If query mentions X, prioritize section Y..."
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Max Items</span>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={100}
                  value={maxItems}
                  onChange={(event) => setMaxItems(Number(event.target.value))}
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  className="h-4 w-4 rounded border-slate-300"
                  type="checkbox"
                  checked={strictCitations}
                  onChange={(event) => setStrictCitations(event.target.checked)}
                />
                <span>Strict citations</span>
              </label>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading.generate}
              >
                {loading.generate ? 'Generating...' : 'Run /api/ai/checklist/generate'}
              </button>
            </form>
          </article>

          <article className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Step 4 - Verify Checklist</h2>
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {verifyResponse ? 'Done' : 'Pending'}
              </span>
            </div>
            <form className="grid gap-3" onSubmit={runVerify}>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-slate-600">Checklist ID</span>
                <input
                  className={inputClass}
                  value={verifyChecklistId}
                  onChange={(event) => setVerifyChecklistId(event.target.value)}
                  placeholder="Auto-filled after generate"
                />
              </label>
              <button
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading.verify}
              >
                {loading.verify ? 'Verifying...' : 'Run /api/ai/checklist/verify'}
              </button>
            </form>
          </article>
        </section>

        {generateResponse && (
          <section className={`${cardClass} md:col-span-2`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Checklist Preview</h2>
              <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {generateResponse.item_count} items
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {generateResponse.items.slice(0, 8).map((item) => (
                <article key={item.item_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${item.priority === 'must_do'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700'
                        }`}
                    >
                      {item.priority}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700">
                      p.{item.evidence.page_number}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-5">{item.text}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{item.evidence.excerpt}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <article className={cardClass}>
            <h2 className="mb-2 text-base font-semibold">Ingest Response</h2>
            <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {ingestResponse ? pretty(ingestResponse) : 'Run ingest to view response.'}
            </pre>
          </article>
          <article className={cardClass}>
            <h2 className="mb-2 text-base font-semibold">Index Response</h2>
            <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {indexResponse ? pretty(indexResponse) : 'Run build index to view response.'}
            </pre>
          </article>
          <article className={cardClass}>
            <h2 className="mb-2 text-base font-semibold">Generate Response</h2>
            <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {generateResponse ? pretty(generateResponse) : 'Run generate to view response.'}
            </pre>
          </article>
          <article className={cardClass}>
            <h2 className="mb-2 text-base font-semibold">Verify Response</h2>
            <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
              {verifyResponse ? pretty(verifyResponse) : 'Run verify to view response.'}
            </pre>
          </article>
        </section>
      </div>
    </main>
  )
}

export default App
