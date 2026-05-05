# LocalLens AI

🚀 **Live Demo:** https://local-lens-ai.vercel.app

LocalLens AI is a full-stack PDF search engine that retrieves relevant information from documents using **TF-IDF, BM25-style ranking, and cosine similarity** — all running locally with **no external AI APIs**.

---

## ✨ Features

* Upload and search multiple PDFs
* Local document indexing
* Ranked search results with relevance scores
* Highlighted keyword matches
* Extractive answers with source references
* Document summaries
* Auto-generated quiz questions
* Works without OpenAI or paid APIs

---

## 🧠 Why This Project Stands Out

Most student AI projects rely on external APIs.
This project implements a **fully local retrieval system**, including:

* Text extraction and chunking
* TF-IDF vectorization
* BM25-style scoring
* Cosine similarity ranking
* Extractive answer generation

---

## 🛠️ Tech Stack

* React (Vite)
* Node.js
* Express
* Multer
* pdf-parse
* Custom retrieval engine

---

## ⚙️ Run Locally

```bash
npm run install:all
npm run dev
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:5050
```

---

## 📸 Demo 

<img width="1528" height="903" alt="image" src="https://github.com/user-attachments/assets/78faf17b-e234-4282-94d3-169e48d4c036" />


---

## 📌 Resume Bullet

Built LocalLens AI, a full-stack document retrieval system using React, Node.js, and custom TF-IDF/BM25-based ranking to enable local semantic search across PDFs without external AI APIs.

---

## 🌐 Deployment

* Frontend: Vercel
* Backend: Render
