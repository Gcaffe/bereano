import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

const BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
  'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
  'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones',
  'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías',
  'Jonás', 'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo',
  'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
  'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
  'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
  '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos',
  'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan',
  '3 Juan', 'Judas', 'Apocalipsis'
]

const CHAPTERS = Array.from({ length: 150 }, (_, i) => i + 1)
const VERSES = Array.from({ length: 50 }, (_, i) => i + 1)

function Consulta() {
  const { t, user, savePrefs } = useApp()
  const navigate = useNavigate()

  const prefs = user.prefs

  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState('')
  const [verseFrom, setVerseFrom] = useState('')
  const [verseTo, setVerseTo] = useState('')
  const [bibleVersion, setBibleVersion] = useState(prefs.version || 'RVR1960')

  const [audience, setAudience] = useState(prefs.audience || 'Adultos')
  const [context, setContext] = useState(prefs.context || 'Culto')
  const [emphasis, setEmphasis] = useState(prefs.emphasis || 'Evangelismo')
  const [tradition, setTradition] = useState(prefs.tradition || 'Alianza Cristiana')
  const [tone, setTone] = useState(prefs.tone || 'Expositivo')
  const [length, setLength] = useState(prefs.length || 'Corto (20 min)')

  const [content, setContent] = useState(prefs.content || {
    exegesis: true,
    commentators: true,
    sermons: true,
    course: true,
    devotionals: true
  })

  const toggleContent = (key) => {
    setContent(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleConsult = () => {
    savePrefs({ version: bibleVersion, audience, context, emphasis, tradition, tone, length, content })
    navigate('/resultados', {
      state: { book, chapter, verseFrom, verseTo, bibleVersion, audience, context, emphasis, tradition, tone, length, content }
    })
  }

  return (
    <div className="screen consulta-screen">

      <div className="regcon-header">
        <div className="header-row">
          <h2>{t.appName} <span>—</span> {t.consult}</h2>
          <button className="btn-back" onClick={() => navigate('/regcon')}>
            {t.back}
          </button>
        </div>
      </div>

      <div className="consulta-body">

      {/* Versión de la Biblia */}
      <div className="form-group">
        <label>{t.bibleVersion}</label>
        <select value={bibleVersion} onChange={e => setBibleVersion(e.target.value)}>
           {t.versions.map(v => <option key={v}>{v}</option>)}
         </select>
      </div>

      {/* Libro / Capítulo / Versículos */}
      <div className="section-label">{t.verseSection}</div>
       <div className="form-row-bible">
          <div className="form-group fg-book">
            <label>{t.book}</label>
            <select value={book} onChange={e => setBook(e.target.value)}>
              <option value="">—</option>
              {BOOKS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group fg-num">
            <label>{t.chapter}</label>
            <select value={chapter} onChange={e => setChapter(e.target.value)}>
              <option value="">—</option>
              {CHAPTERS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group fg-num">
            <label>{t.verseFrom}</label>
            <select value={verseFrom} onChange={e => {
              setVerseFrom(e.target.value)
              setVerseTo(e.target.value)
            }}>
              <option value="">—</option>
              {VERSES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-group fg-num">
            <label>{t.verseTo}</label>
            <select value={verseTo} onChange={e => setVerseTo(e.target.value)}>
              <option value="">—</option>
              {VERSES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Preferencias */}
        <div className="section-label">{t.preferences}</div>
        <div className="form-row">
          <div className="form-group">
            <label>{t.audience}</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}>
              {t.audiences.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{t.context}</label>
            <select value={context} onChange={e => setContext(e.target.value)}>
              {t.contexts.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t.emphasis}</label>
            <select value={emphasis} onChange={e => setEmphasis(e.target.value)}>
              {t.emphases.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{t.tradition}</label>
            <select value={tradition} onChange={e => setTradition(e.target.value)}>
              {t.traditions.map(tr => <option key={tr}>{tr}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t.sermonTone}</label>
            <select value={tone} onChange={e => setTone(e.target.value)}>
              {t.tones.map(to => <option key={to}>{to}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>{t.sermonLength}</label>
            <select value={length} onChange={e => setLength(e.target.value)}>
              {t.lengths.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Contenido deseado */}
        <div className="section-label">{t.desiredContent}</div>
        <div className="checkbox-list">
          {Object.entries(t.content).map(([key, val]) => (
            <div
              key={key}
              className={`checkbox-item ${content[key] ? 'checked' : ''}`}
              onClick={() => toggleContent(key)}
            >
              <input type="checkbox" checked={content[key]} onChange={() => {}} />
              <span>{val}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="regcon-footer">
        <button className="btn-primary" onClick={handleConsult}>
          {t.consult}
        </button>
      </div>

    </div>
  )
}

export default Consulta