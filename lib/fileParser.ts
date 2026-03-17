const MAX_WORDS = 3000

function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '\n\n[Document truncated at 3,000 words]'
}

async function extractFromTxt(file: File): Promise<string> {
  const text = await file.text()
  return truncateToWordLimit(text, MAX_WORDS)
}

async function extractFromPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist')

  // Set worker source via CDN to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: unknown) => {
        if (typeof item === 'object' && item !== null && 'str' in item) {
          return (item as { str: string }).str
        }
        return ''
      })
      .join(' ')
    textParts.push(pageText)
  }

  return truncateToWordLimit(textParts.join('\n'), MAX_WORDS)
}

async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return truncateToWordLimit(result.value, MAX_WORDS)
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.txt')) {
    return extractFromTxt(file)
  } else if (name.endsWith('.pdf')) {
    return extractFromPdf(file)
  } else if (name.endsWith('.doc') || name.endsWith('.docx')) {
    return extractFromDocx(file)
  } else {
    throw new Error(`Unsupported file type. Please upload .txt, .pdf, .doc, or .docx files.`)
  }
}
