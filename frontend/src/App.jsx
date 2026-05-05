import React, { useEffect, useMemo, useState } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050"

function App() {
  const [documents, setDocuments] = useState([])
  const [stats, setStats] = useState({ documents: 0, uploaded: 0, samples: 0, chunks: 0, words: 0 })
  const [query, setQuery] = useState("What is overfitting?")
  const [results, setResults] = useState([])
  const [answer, setAnswer] = useState("")
  const [selectedDoc, setSelectedDoc] = useState("")
  const [summary, setSummary] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState("")
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  const selectedDocument = useMemo(() => documents.find(doc => doc.id === selectedDoc), [documents, selectedDoc])

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Request failed")
    return data
  }

  async function refreshDocuments() {
    const data = await api("/api/documents")
    setDocuments(data.documents)
    setStats(data.stats)
    if (!selectedDoc && data.documents[0]) setSelectedDoc(data.documents[0].id)
  }

  useEffect(() => {
    refreshDocuments().catch(err => setError(err.message))
  }, [])

  async function uploadFiles(chosenFiles = files) {
    if (!chosenFiles.length) return
    setLoading("upload")
    setError("")
    const formData = new FormData()
    chosenFiles.forEach(file => formData.append("files", file))

    try {
      const response = await fetch(`${API_URL}/api/documents`, {
        method: "POST",
        body: formData
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Upload failed")
      setDocuments(data.documents)
      setStats(data.stats)
      setSelectedDoc(data.added[0]?.id || data.documents[0]?.id || "")
      setFiles([])
      setSummary(null)
      setQuiz(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  async function runSearch(event) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading("search")
    setError("")
    setSummary(null)
    setQuiz(null)

    try {
      const data = await api("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, topK: 8 })
      })
      setAnswer(data.answer)
      setResults(data.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  async function summarizeDoc(id = selectedDoc) {
    if (!id) return
    setLoading("summary")
    setError("")
    setQuiz(null)

    try {
      const data = await api("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id })
      })
      setSummary(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  async function generateQuiz(id = selectedDoc) {
    if (!id) return
    setLoading("quiz")
    setError("")
    setSummary(null)

    try {
      const data = await api("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, count: 5 })
      })
      setQuiz(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  async function deleteDoc(id) {
    setLoading("delete")
    setError("")

    try {
      const data = await api(`/api/documents/${id}`, { method: "DELETE" })
      setDocuments(data.documents)
      setStats(data.stats)
      setSelectedDoc(data.documents[0]?.id || "")
      setSummary(null)
      setQuiz(null)
      setResults([])
      setAnswer("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  async function clearUploads() {
    setLoading("clear")
    setError("")

    try {
      const data = await api("/api/uploads", { method: "DELETE" })
      setDocuments(data.documents)
      setStats(data.stats)
      setSelectedDoc(data.documents[0]?.id || "")
      setSummary(null)
      setQuiz(null)
      setResults([])
      setAnswer("")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading("")
    }
  }

  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    const dropped = [...event.dataTransfer.files].filter(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))
    setFiles(dropped)
    if (dropped.length) uploadFiles(dropped)
  }

  return (
    <main>
      <section className="hero">
        <div className="heroText">
          <div className="pill">No API keys • No paid AI • Runs locally</div>
          <h1>LocalLens AI</h1>
          <p>A polished PDF search engine that ranks document evidence using local retrieval, TF-IDF weighting, BM25-style scoring, and cosine similarity.</p>
          <form className="searchBar" onSubmit={runSearch}>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ask a question about your PDFs..." />
            <button disabled={loading === "search"}>{loading === "search" ? "Searching..." : "Search"}</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
        <div className="heroCard">
          <Stat label="Documents" value={stats.documents} />
          <Stat label="Chunks indexed" value={stats.chunks} />
          <Stat label="Words processed" value={stats.words.toLocaleString()} />
          <Stat label="Uploaded PDFs" value={stats.uploaded} />
        </div>
      </section>

      <section className="grid">
        <aside className="panel">
          <div className="panelHeader">
            <div>
              <h2>Documents</h2>
              <p>Upload PDFs or use the built-in samples.</p>
            </div>
            <button className="ghost" onClick={clearUploads} disabled={loading === "clear" || !stats.uploaded}>Clear uploads</button>
          </div>

          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={event => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="dropIcon">⬆</div>
            <strong>Drop PDFs here</strong>
            <span>or choose files from your computer</span>
            <input type="file" accept="application/pdf" multiple onChange={event => setFiles([...event.target.files])} />
            <button onClick={() => uploadFiles()} disabled={loading === "upload" || !files.length}>{loading === "upload" ? "Indexing..." : files.length ? `Upload ${files.length} file(s)` : "Choose PDFs first"}</button>
          </div>

          <div className="docList">
            {documents.map(doc => (
              <article className={`doc ${selectedDoc === doc.id ? "active" : ""}`} key={doc.id} onClick={() => setSelectedDoc(doc.id)}>
                <div>
                  <h3>{doc.title}</h3>
                  <p>{doc.preview}</p>
                  <span>{doc.sourceType} • {doc.pages} page{doc.pages === 1 ? "" : "s"} • {doc.wordCount.toLocaleString()} words</span>
                </div>
                <div className="docActions">
                  <button onClick={event => {
                    event.stopPropagation()
                    summarizeDoc(doc.id)
                  }}>Summary</button>
                  <button onClick={event => {
                    event.stopPropagation()
                    generateQuiz(doc.id)
                  }}>Quiz</button>
                  {doc.sourceType !== "sample" && (
                    <button className="danger" onClick={event => {
                      event.stopPropagation()
                      deleteDoc(doc.id)
                    }}>Delete</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="workspace">
          {answer && (
            <section className="answerCard">
              <div className="sectionTitle">
                <span>Extractive answer</span>
                <small>Built locally from retrieved evidence</small>
              </div>
              <p>{answer}</p>
            </section>
          )}

          {summary && !summary.error && (
            <section className="answerCard">
              <div className="sectionTitle">
                <span>Summary: {summary.document.title}</span>
                <small>Top evidence sentences and key terms</small>
              </div>
              <ul className="summaryList">
                {summary.summary.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
              <div className="tags">
                {summary.keyTerms.map(item => <span key={item.term}>{item.term}</span>)}
              </div>
            </section>
          )}

          {quiz && !quiz.error && (
            <section className="answerCard">
              <div className="sectionTitle">
                <span>Quiz: {quiz.document.title}</span>
                <small>Generated without an AI API</small>
              </div>
              <div className="quizList">
                {quiz.questions.length ? quiz.questions.map((item, index) => <QuizCard item={item} index={index} key={index} />) : <p>Not enough strong terms found to generate quiz questions.</p>}
              </div>
            </section>
          )}

          <section className="results">
            <div className="sectionTitle">
              <span>Search results</span>
              <small>{results.length ? `${results.length} ranked matches` : selectedDocument ? `Selected: ${selectedDocument.title}` : "Run a search to see evidence"}</small>
            </div>

            {results.length === 0 && (
              <div className="empty">
                <h2>Try the sample query</h2>
                <p>Search for “What is overfitting?”, “What is the CIA triad?”, or upload your own PDFs.</p>
              </div>
            )}

            {results.map(result => <ResultCard key={result.chunkId} result={result} query={query} />)}
          </section>
        </section>
      </section>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function highlight(text, query) {
  const terms = [...new Set(String(query).toLowerCase().match(/[a-z0-9]+/g) || [])].filter(term => term.length > 2)
  if (!terms.length) return text
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi")
  return String(text).split(pattern).map((part, index) => terms.includes(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function ResultCard({ result, query }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="resultCard">
      <div className="resultTop">
        <div>
          <h3>{result.title}</h3>
          <span>Page {result.page} • Section {result.section} • Rank #{result.rank}</span>
        </div>
        <div className="score">{result.relevance}%</div>
      </div>
      <div className="meter"><div style={{ width: `${result.relevance}%` }} /></div>
      <p>{highlight(result.snippet, query)}</p>
      <button className="ghost" onClick={() => setOpen(!open)}>{open ? "Hide full chunk" : "Show full chunk"}</button>
      {open && <div className="fullText">{highlight(result.text, query)}</div>}
    </article>
  )
}

function QuizCard({ item, index }) {
  const [selected, setSelected] = useState("")

  return (
    <article className="quizCard">
      <h3>{index + 1}. {item.question}</h3>
      <div className="options">
        {item.options.map(option => (
          <button className={selected ? option === item.answer ? "correct" : option === selected ? "wrong" : "" : ""} key={option} onClick={() => setSelected(option)}>{option}</button>
        ))}
      </div>
      {selected && <p>{selected === item.answer ? "Correct." : `Answer: ${item.answer}`}</p>}
    </article>
  )
}

export default App
