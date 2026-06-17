const MAX_WORDS = 3000
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export type FileForExtraction =
  | { kind: 'text'; text: string; filename: string }
  | { kind: 'document'; data_b64: string; media_type: 'application/pdf'; filename: string }
  | {
      kind: 'image'
      data_b64: string
      media_type: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
      filename: string
    }

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
  }
  // Browser btoa is fine — bytes are already 0–255 from the ArrayBuffer.
  return typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64')
}

function imageMediaType(name: string): FileForExtraction & { kind: 'image' } extends { media_type: infer M } ? M : never {
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

/**
 * Detects the file type and returns either extracted text (TXT/DOCX/MD) or a
 * base64-encoded payload (PDF/image). PDFs and images go to the server so
 * Claude can read them natively — no client-side pdfjs.
 */
export async function readFileForExtraction(file: File): Promise<FileForExtraction> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max 10 MB — try a smaller one.`,
    )
  }
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) {
    return { kind: 'document', data_b64: await fileToBase64(file), media_type: 'application/pdf', filename: file.name }
  }
  if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
    return {
      kind: 'image',
      data_b64: await fileToBase64(file),
      media_type: imageMediaType(name),
      filename: file.name,
    }
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return { kind: 'text', text: truncateToWordLimit(await file.text(), MAX_WORDS), filename: file.name }
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    const mammoth = await import('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return { kind: 'text', text: truncateToWordLimit(result.value, MAX_WORDS), filename: file.name }
  }
  throw new Error('Unsupported file type. Try PDF, DOCX, TXT, MD, or PNG/JPG.')
}

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
