import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8300'

function buildPrompt(state, t) {
  const { book, chapter, verseFrom, verseTo, bibleVersion,
          audience, context, emphasis, tradition, tone, length, content } = state

  const verseRef = `${book} ${chapter}:${verseFrom}${verseTo && verseTo !== verseFrom ? '-' + verseTo : ''}`
  const selected = Object.entries(content).filter(([,v]) => v).map(([k]) => t.content[k]).join(', ')

  return `Eres un experto en teología bíblica protestante, exégesis y homilética. Genera material completo en español para el siguiente texto bíblico.

TEXTO BÍBLICO: ${verseRef} (versión ${bibleVersion})
AUDIENCIA: ${audience}
CONTEXTO: ${context}
ÉNFASIS: ${emphasis}
TRADICIÓN TEOLÓGICA: ${tradition}
TONO DE SERMONES: ${tone}
EXTENSIÓN POR SERMÓN: ${length}
CONTENIDO SOLICITADO: ${selected}

Genera el material solicitado bien estructurado con encabezados Markdown (##, ###). Incluye para cada sección solicitada:

${content.exegesis ? `## ANÁLISIS EXEGÉTICO, TEOLÓGICO Y PASTORAL
### Contexto histórico
### Análisis del texto original (palabras clave griego/hebreo)
### Temas teológicos centrales
### Aplicación pastoral` : ''}

${content.commentators ? `## COMENTARISTAS PROTESTANTES CLÁSICOS
Incluye perspectivas de al menos 5 comentaristas relevantes (Calvino, Matthew Henry, F.F. Bruce, D.A. Carson, John Stott, R.C. Sproul, etc.)` : ''}

${content.sermons ? `## SERIE DE 4 SERMONES EXPOSITIVOS
Para cada sermón: título, texto base, proposición central, introducción con ilustración, 3-4 puntos desarrollados, conclusión con llamado` : ''}

${content.course ? `## CURSO DE ESTUDIO BÍBLICO (4 LECCIONES)
Para cada lección: objetivo, observación (3 preguntas), interpretación (3 preguntas), aplicación (3 preguntas), actividad grupal` : ''}

${content.devotionals ? `## DEVOCIONARIOS PARA 30 DÍAS
Para cada día: título, texto, reflexión, oración, aplicación práctica` : ''}

Usa tono ${tone.toLowerCase()} y lenguaje accesible para ${audience.toLowerCase()}.`
}

function markdownToPlain(text) {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---/g, '─────────────')
    .trim()
}

export default function Resultados() {
  const { t, user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state

  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('prompt') // prompt | generating | done

  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [duration, setDuration] = useState('')

  useEffect(() => {
    if (state) setPrompt(buildPrompt(state, t))
  }, [])

  const getApiKey = (platform) => {
    const keys = {
      claude:   import.meta.env.VITE_ANTHROPIC_KEY,
      chatgpt:  import.meta.env.VITE_OPENAI_KEY,
      deepseek: import.meta.env.VITE_DEEPSEEK_KEY,
      gemini:   import.meta.env.VITE_GEMINI_KEY,
    }
    return keys[platform] || ''
  }

  const generate = async () => {
    if (!state?.book) { setError(t.errorNoVerse); return }
    setError('')
    setLoading(true)
    setPhase('generating')
    setResult('')

    const start = new Date()
    setStartTime(start)
    setEndTime(null)
    setDuration('')

    const platform = user.platform || 'claude'

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, platform })
      })

      if (!res.ok) throw new Error('Error en el servidor')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) setResult(prev => prev + parsed.text)
          } catch {}
        }
      }

      const end = new Date()
      setEndTime(end)
      const diff = Math.floor((end - start) / 1000)
      const mins = Math.floor(diff / 60)
      const secs = diff % 60
      setDuration(`${mins}:${secs.toString().padStart(2, '0')} min`)

      setPhase('done')

    } catch (err) {
      console.error('Error completo:', err)
      setError(err.message || t.errorApi)
      setPhase('prompt')
    } finally {
      setLoading(false)
    }
  }

  const downloadTxt = () => {
    const blob = new Blob([markdownToPlain(result)], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, `bereano-${state?.book || 'estudio'}.txt`)
  }

  const downloadPDF = () => {
    const doc = new jsPDF()
    const lines = doc.splitTextToSize(markdownToPlain(result), 180)
    let y = 15
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 15 }
      doc.text(line, 15, y)
      y += 7
    })
    doc.save(`bereano-${state?.book || 'estudio'}.pdf`)
  }

  const downloadWord = async () => {
    const paragraphs = result.split('\n').map(line => {
      if (line.startsWith('## '))
        return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: line.replace('## ', ''), bold: true })] })
      if (line.startsWith('### '))
        return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line.replace('### ', ''), bold: true })] })
      return new Paragraph({ children: [new TextRun(line)] })
    })
    const doc = new Document({ sections: [{ children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `bereano-${state?.book || 'estudio'}.docx`)
  }

  const verseRef = state ? `${state.book} ${state.chapter}:${state.verseFrom}${state.verseTo && state.verseTo !== state.verseFrom ? '-' + state.verseTo : ''}` : ''

  return (
    <div className="screen resultados-screen">

      <div className="regcon-header">
        <div className="header-row">
          <h2>{t.appName} <span>—</span> {phase === 'done' ? t.results : t.promptTitle}</h2>
          {phase !== 'generating' && (
            <button className="btn-back" onClick={() => navigate('/consulta')}>
              {t.back}
            </button>
          )}
        </div>
      </div>

      {phase === 'prompt' && (
        <div className="resultados-body">
          {verseRef && <div className="verse-ref-badge">{verseRef} — {state.bibleVersion}</div>}
          <p className="prompt-hint">{t.promptHint}</p>
          <textarea
            className="prompt-editor"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={12}
          />
          {error && <p className="error-msg">{error}</p>}
          <div className="resultados-footer">
            <button className="btn-primary" onClick={generate}>
              {t.startGenerate}
            </button>
          </div>
        </div>
      )}

      {phase === 'generating' && (
        <div className="generating-box">
          <div className="spinner">📖</div>
          <p>{t.generating}</p>
          <div className="result-stream">
            {result.split('\n').map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="resultados-body">

          {/* Barra de tiempo */}
          {startTime && (
            <div className="time-bar">
              <span>📖 {verseRef} — {state.bibleVersion}</span>
              <span>⏱ {startTime.toLocaleTimeString()} → {endTime?.toLocaleTimeString()} • {duration}</span>
            </div>
          )}

          <div className="result-content">
            {result.split('\n').map((line, i) => {
              if (line.startsWith('## '))  return <h2 key={i}>{line.replace('## ', '')}</h2>
              if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>
              if (line === '---') return <hr key={i} />
              return <p key={i}>{line}</p>
            })}
          </div>

          <div className="download-buttons">
            <button className="btn-download" onClick={downloadWord}>📄 {t.downloadWord}</button>
            <button className="btn-download" onClick={downloadTxt}>📝 {t.downloadTxt}</button>
          </div>

          <div className="resultados-footer">
            <button className="btn-secondary" onClick={() => navigate('/consulta')}>
              {t.newConsult}
            </button>
          </div>

        </div>
      )}

    </div>
  )
}