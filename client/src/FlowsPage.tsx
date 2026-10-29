import { useEffect, useRef, useState } from 'react'
import { mount, register, type Mounted } from 'pele/core'
import flowchart from 'pele/diagrams/flowchart'
import signUpDoc from '../../docs/signup-flow.md?raw'
import signInDoc from '../../docs/signin-flow.md?raw'
import './FlowsPage.css'

// Only flowcharts are shown here, so skip bundling pele's other diagram types.
register(flowchart)

// The docs are the source of truth; pull the first ```mermaid block out of each.
const mermaidBlock = (md: string) => md.match(/```mermaid\n([\s\S]*?)```/)?.[1] ?? ''

const FLOWS = [
  { id: 'sign-up', title: 'Sign-up flow', source: mermaidBlock(signUpDoc) },
  { id: 'sign-in', title: 'Sign-in flow (email OTP)', source: mermaidBlock(signInDoc) },
]

function Diagram({ source }: { source: string }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const mountedRef = useRef<Mounted | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setError(null)
    const mounted = mount(ref.current!, source, {
      onError: (e) => setError(e instanceof Error ? e.message : String(e)),
    })
    mountedRef.current = mounted
    return () => mounted.destroy()
  }, [source])

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === frameRef.current)
      // The container just changed size; re-layout the diagram to fit it.
      mountedRef.current?.refresh()
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : frameRef.current!.requestFullscreen()
    request.catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="diagram-frame" ref={frameRef}>
        {document.fullscreenEnabled && (
          <button
            className="fullscreen-toggle"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d={
                  fullscreen
                    ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'
                    : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="diagram" ref={ref} />
      </div>
    </>
  )
}

// The selected flow lives in the URL hash so it survives reloads and can be linked to.
const flowFromHash = () => FLOWS.find((f) => `#${f.id}` === location.hash) ?? FLOWS[0]

function Flows() {
  const [active, setActive] = useState(flowFromHash)

  useEffect(() => {
    const onHashChange = () => setActive(flowFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const select = (flow: (typeof FLOWS)[number]) => {
    setActive(flow)
    history.replaceState(null, '', `#${flow.id}`)
  }

  return (
    <main className="flows">
      <h1>Auth flows</h1>
      <a className="back" href="/">
        ← Back to todos
      </a>

      <nav className="tabs" role="tablist" aria-label="Diagram">
        {FLOWS.map((flow) => (
          <button
            key={flow.id}
            role="tab"
            id={`tab-${flow.id}`}
            aria-selected={flow.id === active.id}
            aria-controls={`panel-${flow.id}`}
            className={flow.id === active.id ? 'active' : ''}
            onClick={() => select(flow)}
          >
            {flow.title}
          </button>
        ))}
      </nav>

      <section
        className="flow"
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
      >
        <Diagram key={active.id} source={active.source} />
      </section>
    </main>
  )
}

export default Flows
