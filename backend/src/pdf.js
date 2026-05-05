const pdfParse = require("pdf-parse")

async function extractPdf(buffer) {
  const pages = []

  const options = {
    pagerender: async pageData => {
      const content = await pageData.getTextContent()
      const strings = content.items.map(item => item.str).filter(Boolean)
      const text = strings.join(" ").replace(/\s+/g, " ").trim()
      pages.push(text)
      return text
    }
  }

  const data = await pdfParse(buffer, options)
  const fallbackText = String(data.text || "").replace(/\s+/g, " ").trim()
  const cleanPages = pages.map(page => String(page || "").replace(/\s+/g, " ").trim()).filter(Boolean)

  if (cleanPages.length === 0 && fallbackText) {
    return {
      text: fallbackText,
      pages: [{ pageNumber: 1, text: fallbackText }]
    }
  }

  return {
    text: cleanPages.join("\n\n"),
    pages: cleanPages.map((text, index) => ({
      pageNumber: index + 1,
      text
    }))
  }
}

module.exports = { extractPdf }
