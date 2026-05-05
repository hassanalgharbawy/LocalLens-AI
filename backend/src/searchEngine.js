const crypto = require("crypto")

const stopwords = new Set([
  "a","an","and","are","as","at","be","been","but","by","can","could","did","do","does","for","from","had","has","have","he","her","his","how","i","if","in","into","is","it","its","may","more","most","not","of","on","or","our","she","should","so","than","that","the","their","them","then","there","these","they","this","to","was","we","were","what","when","where","which","who","why","will","with","you","your"
])

const synonyms = {
  ai: ["artificial", "intelligence", "machine"],
  ml: ["machine", "learning", "model"],
  model: ["algorithm", "classifier", "predictor"],
  security: ["cybersecurity", "protection", "authentication"],
  password: ["authentication", "account", "access"],
  graph: ["vertices", "edges", "network"],
  array: ["indexing", "list", "storage"],
  overfitting: ["memorizes", "regularization", "validation"],
  regression: ["numeric", "prediction", "continuous"],
  classification: ["category", "class", "label"]
}

function id() {
  return crypto.randomBytes(8).toString("hex")
}

function cleanText(text) {
  return String(text || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stem(token) {
  if (token.length > 5 && token.endsWith("ies")) return token.slice(0, -3) + "y"
  if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3)
  if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith("ly")) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1)
  return token
}

function tokenize(text) {
  const matches = String(text || "").toLowerCase().match(/[a-z0-9]+/g) || []
  return matches.map(stem).filter(token => token.length > 1 && !stopwords.has(token))
}

function expandTokens(tokens) {
  const expanded = new Set(tokens)
  for (const token of tokens) {
    const additions = synonyms[token] || []
    additions.forEach(word => expanded.add(stem(word.toLowerCase())))
  }
  return [...expanded]
}

function termFreq(tokens) {
  const tf = new Map()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  return tf
}

function splitSentences(text) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 25)
}

function chunkPage(text, size = 155, overlap = 35) {
  const words = cleanText(text).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  if (words.length <= size) return [words.join(" ")]
  const chunks = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + size, words.length)
    chunks.push(words.slice(start, end).join(" "))
    if (end === words.length) break
    start = Math.max(end - overlap, start + 1)
  }

  return chunks
}

function createSearchEngine() {
  let documents = []
  let chunks = []
  let df = new Map()
  let avgdl = 0

  function rebuildIndex() {
    df = new Map()
    let totalLength = 0

    for (const chunk of chunks) {
      chunk.tokens = tokenize(chunk.text)
      chunk.expandedTokens = chunk.tokens
      chunk.termFreq = termFreq(chunk.tokens)
      chunk.length = chunk.tokens.length || 1
      totalLength += chunk.length

      for (const token of new Set(chunk.tokens)) {
        df.set(token, (df.get(token) || 0) + 1)
      }
    }

    avgdl = chunks.length ? totalLength / chunks.length : 1
  }

  function idf(token) {
    const n = chunks.length || 1
    const d = df.get(token) || 0
    return Math.log(1 + (n - d + 0.5) / (d + 0.5))
  }

  function addDocument(input) {
    const pages = Array.isArray(input.pages) && input.pages.length
      ? input.pages.map((page, index) => ({
          pageNumber: page.pageNumber || index + 1,
          text: cleanText(page.text)
        })).filter(page => page.text)
      : [{ pageNumber: 1, text: cleanText(input.text) }]

    const text = pages.map(page => page.text).join(" ")
    const doc = {
      id: id(),
      title: cleanText(input.title || "Untitled Document"),
      sourceType: input.sourceType || "uploaded",
      createdAt: new Date().toISOString(),
      pages: pages.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      preview: text.slice(0, 220)
    }

    documents.push(doc)

    pages.forEach(page => {
      chunkPage(page.text).forEach((chunkText, index) => {
        chunks.push({
          id: id(),
          docId: doc.id,
          title: doc.title,
          sourceType: doc.sourceType,
          page: page.pageNumber,
          localIndex: index + 1,
          text: chunkText
        })
      })
    })

    rebuildIndex()
    return doc
  }

  function addTextDocuments(docs) {
    docs.forEach(addDocument)
  }

  function removeDocument(documentId) {
    const before = documents.length
    documents = documents.filter(doc => doc.id !== documentId || doc.sourceType === "sample")
    chunks = chunks.filter(chunk => chunk.docId !== documentId || chunk.sourceType === "sample")
    rebuildIndex()
    return before !== documents.length
  }

  function clearUploaded() {
    documents = documents.filter(doc => doc.sourceType === "sample")
    chunks = chunks.filter(chunk => chunk.sourceType === "sample")
    rebuildIndex()
  }

  function scoreChunk(chunk, query, queryTokens) {
    let bm25 = 0
    const k1 = 1.45
    const b = 0.72
    const qtf = termFreq(queryTokens)

    for (const token of new Set(queryTokens)) {
      const tf = chunk.termFreq.get(token) || 0
      if (!tf) continue
      const numerator = tf * (k1 + 1)
      const denominator = tf + k1 * (1 - b + b * (chunk.length / avgdl))
      bm25 += idf(token) * (numerator / denominator)
    }

    let dot = 0
    let qNorm = 0
    let cNorm = 0
    const allTerms = new Set([...queryTokens, ...chunk.tokens])

    for (const token of allTerms) {
      const qWeight = (qtf.get(token) || 0) * idf(token)
      const cWeight = (chunk.termFreq.get(token) || 0) * idf(token)
      dot += qWeight * cWeight
      qNorm += qWeight * qWeight
      cNorm += cWeight * cWeight
    }

    const cosine = qNorm && cNorm ? dot / (Math.sqrt(qNorm) * Math.sqrt(cNorm)) : 0
    const lowerText = chunk.text.toLowerCase()
    const lowerTitle = chunk.title.toLowerCase()
    const normalizedQuery = query.toLowerCase()
    const phraseBonus = normalizedQuery.length > 3 && lowerText.includes(normalizedQuery) ? 1.8 : 0
    const titleBonus = queryTokens.some(token => lowerTitle.includes(token)) ? 0.5 : 0
    return bm25 * 0.85 + cosine * 3.2 + phraseBonus + titleBonus
  }

  function bestSnippet(text, queryTokens) {
    const sentences = splitSentences(text)
    if (!sentences.length) return text.slice(0, 450)

    const ranked = sentences.map(sentence => {
      const tokens = tokenize(sentence)
      let score = 0
      for (const token of queryTokens) {
        score += tokens.includes(token) ? 1 : 0
      }
      return { sentence, score }
    }).sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length)

    return ranked.slice(0, 2).map(item => item.sentence).join(" ")
  }

  function search(query, topK = 8) {
    const rawTokens = tokenize(query)
    const queryTokens = expandTokens(rawTokens)

    if (!rawTokens.length) {
      return {
        query,
        answer: "Try a more specific search with terms from your document.",
        results: [],
        suggestions: getSuggestions()
      }
    }

    const ranked = chunks.map(chunk => {
      const score = scoreChunk(chunk, query, queryTokens)
      return {
        chunk,
        score
      }
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    const maxScore = ranked[0]?.score || 1

    const results = ranked.map((item, index) => {
      const relevance = Math.max(12, Math.min(99, Math.round((item.score / maxScore) * 96)))
      return {
        rank: index + 1,
        chunkId: item.chunk.id,
        documentId: item.chunk.docId,
        title: item.chunk.title,
        page: item.chunk.page,
        section: item.chunk.localIndex,
        relevance,
        score: Number(item.score.toFixed(4)),
        snippet: bestSnippet(item.chunk.text, rawTokens),
        text: item.chunk.text
      }
    })

    const answer = buildAnswer(query, results)

    return {
      query,
      answer,
      results,
      suggestions: getSuggestions()
    }
  }

  function buildAnswer(query, results) {
    if (!results.length) {
      return `No strong local match was found for "${query}". Try using keywords that appear directly in the documents.`
    }

    const top = results[0]
    const extra = results.slice(1, 3)
    let answer = `Best local match: ${top.snippet} Source: ${top.title}, page ${top.page}.`

    if (extra.length) {
      answer += " Related evidence: " + extra.map(result => `${result.title} page ${result.page}`).join("; ") + "."
    }

    return answer
  }

  function summarize(documentId) {
    const doc = documents.find(item => item.id === documentId)
    if (!doc) {
      return { error: "Document not found." }
    }

    const docChunks = chunks.filter(chunk => chunk.docId === documentId)
    const allText = docChunks.map(chunk => chunk.text).join(" ")
    const sentences = splitSentences(allText)
    const titleTokens = tokenize(doc.title)
    const terms = keyTerms(documentId, 12).map(item => item.term)

    const ranked = sentences.map((sentence, index) => {
      const tokens = tokenize(sentence)
      let score = 0
      terms.forEach(term => {
        if (tokens.includes(term)) score += 2
      })
      titleTokens.forEach(term => {
        if (tokens.includes(term)) score += 1
      })
      if (index < 5) score += 0.8
      if (sentence.length > 80 && sentence.length < 260) score += 0.6
      return { sentence, index, score }
    }).sort((a, b) => b.score - a.score)

    const summary = ranked.slice(0, 6).sort((a, b) => a.index - b.index).map(item => item.sentence)

    return {
      document: doc,
      summary,
      keyTerms: keyTerms(documentId, 10)
    }
  }

  function keyTerms(documentId, limit = 10) {
    const docChunks = chunks.filter(chunk => chunk.docId === documentId)
    const counts = new Map()

    for (const chunk of docChunks) {
      for (const [token, count] of chunk.termFreq.entries()) {
        counts.set(token, (counts.get(token) || 0) + count * Math.max(idf(token), 0.2))
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([term]) => term.length > 2)
      .slice(0, limit)
      .map(([term, weight]) => ({ term, weight: Number(weight.toFixed(2)) }))
  }

  function generateQuiz(documentId, count = 5) {
    const doc = documents.find(item => item.id === documentId)
    if (!doc) {
      return { error: "Document not found." }
    }

    const terms = keyTerms(documentId, 18).map(item => item.term)
    const docChunks = chunks.filter(chunk => chunk.docId === documentId)
    const sentences = splitSentences(docChunks.map(chunk => chunk.text).join(" "))
    const questions = []

    for (const term of terms) {
      const sentence = sentences.find(item => tokenize(item).includes(term) && item.length < 260)
      if (!sentence) continue

      const regex = new RegExp(`\\b${term}\\w*\\b`, "i")
      const prompt = sentence.replace(regex, "_____")
      const distractors = terms.filter(item => item !== term).slice(0, 12).sort(() => 0.5 - Math.random()).slice(0, 3)
      const options = [...distractors, term].sort(() => 0.5 - Math.random())

      if (options.length === 4 && prompt.includes("_____")) {
        questions.push({
          question: `Which term best completes this statement? "${prompt}"`,
          options,
          answer: term
        })
      }

      if (questions.length >= count) break
    }

    return {
      document: doc,
      questions
    }
  }

  function getSuggestions() {
    return keyTerms(documents[0]?.id || "", 5).map(item => item.term)
  }

  function getDocuments() {
    return documents.map(doc => ({ ...doc }))
  }

  function getStats() {
    const uploaded = documents.filter(doc => doc.sourceType === "uploaded").length
    const samples = documents.filter(doc => doc.sourceType === "sample").length
    const words = documents.reduce((sum, doc) => sum + doc.wordCount, 0)

    return {
      documents: documents.length,
      uploaded,
      samples,
      chunks: chunks.length,
      words
    }
  }

  return {
    addDocument,
    addTextDocuments,
    removeDocument,
    clearUploaded,
    search,
    summarize,
    generateQuiz,
    getDocuments,
    getStats
  }
}

module.exports = { createSearchEngine }
