# LocalLens AI

LocalLens AI is a zero-cost local PDF search engine that lets users upload documents, search across them, view ranked evidence, generate extractive summaries, and create quiz questions without using OpenAI, ChatGPT, paid APIs, or external AI services.

## Why this project stands out

Most student AI projects are API wrappers. This project implements the core retrieval system locally using text extraction, chunking, TF-IDF weighting, BM25-style ranking, cosine similarity, relevance scoring, and extractive answer generation.

## Features

- Multi-PDF upload
- Local document indexing
- TF-IDF and BM25-style search
- Cosine similarity scoring
- Highlighted matching terms
- Relevance percentages
- Extractive answer panel
- Source/page-style citations
- Document summaries
- Auto-generated quiz questions
- Built-in sample documents
- No API key required
- No paid services required

## Tech stack

- React
- Vite
- Node.js
- Express
- Multer
- pdf-parse
- Custom local retrieval engine

## Run locally

```bash
npm run install:all
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:5050
```

## GitHub description

A local AI-style PDF search engine using TF-IDF, BM25-style scoring, and cosine similarity to retrieve relevant document evidence without paid APIs.

## Resume bullet

Built LocalLens AI, a full-stack local document retrieval engine using React, Node.js, Express, PDF parsing, TF-IDF vectorization, BM25-style ranking, and cosine similarity to search PDFs and generate extractive answers without external AI APIs.

## Suggested screenshots for GitHub

- Home dashboard
- PDF upload panel
- Search results with relevance scores
- Extractive answer with sources
- Summary generator
- Quiz generator

## Deployment note

This project does not require OpenAI or any paid API. It can be deployed as a normal full-stack web app, but the main portfolio value is that anyone can clone it and run it locally for free.
