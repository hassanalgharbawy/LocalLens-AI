const express = require("express")
const cors = require("cors")
const multer = require("multer")
const { createSearchEngine } = require("./src/searchEngine")
const { extractPdf } = require("./src/pdf")
const { sampleDocuments } = require("./src/sampleDocs")

const app = express()
const port = process.env.PORT || 5050

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 8
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")
    cb(isPdf ? null : new Error("Only PDF files are supported"), isPdf)
  }
})

const engine = createSearchEngine()
engine.addTextDocuments(sampleDocuments)

app.use(cors({ origin: true }))
app.use(express.json({ limit: "2mb" }))

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    project: "LocalLens AI",
    mode: "local",
    documents: engine.getDocuments().length,
    chunks: engine.getStats().chunks
  })
})

app.get("/api/documents", (req, res) => {
  res.json({
    documents: engine.getDocuments(),
    stats: engine.getStats()
  })
})

app.post("/api/documents", upload.array("files", 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Upload at least one PDF file." })
    }

    const added = []

    for (const file of req.files) {
      const extracted = await extractPdf(file.buffer)
      const document = engine.addDocument({
        title: file.originalname.replace(/\.pdf$/i, ""),
        sourceType: "uploaded",
        text: extracted.text,
        pages: extracted.pages
      })
      added.push(document)
    }

    res.json({
      added,
      documents: engine.getDocuments(),
      stats: engine.getStats()
    })
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not process PDF." })
  }
})

app.delete("/api/documents/:id", (req, res) => {
  const removed = engine.removeDocument(req.params.id)
  res.json({
    removed,
    documents: engine.getDocuments(),
    stats: engine.getStats()
  })
})

app.delete("/api/uploads", (req, res) => {
  engine.clearUploaded()
  res.json({
    documents: engine.getDocuments(),
    stats: engine.getStats()
  })
})

app.post("/api/search", (req, res) => {
  const query = String(req.body.query || "").trim()
  const topK = Math.min(Number(req.body.topK || 8), 12)

  if (query.length < 2) {
    return res.status(400).json({ error: "Enter a longer search query." })
  }

  const payload = engine.search(query, topK)
  res.json(payload)
})

app.post("/api/summarize", (req, res) => {
  const documentId = String(req.body.documentId || "")
  const summary = engine.summarize(documentId)
  res.json(summary)
})

app.post("/api/quiz", (req, res) => {
  const documentId = String(req.body.documentId || "")
  const count = Math.min(Number(req.body.count || 5), 10)
  const quiz = engine.generateQuiz(documentId, count)
  res.json(quiz)
})

app.use((error, req, res, next) => {
  res.status(400).json({ error: error.message || "Request failed." })
})

app.listen(port, () => {
  console.log(`LocalLens AI backend running on http://localhost:${port}`)
})
