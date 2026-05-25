import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

function RegCon() {
  const { t, user, saveUser } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user.name || '',
    birthYear: user.birthYear || '',
    church: user.church || '',
    role: user.role || '',
    platform: user.platform || 'claude',
    password: user.password || ''
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = () => {
    saveUser(form)
    navigate('/consulta')
  }

  return (
    <div className="screen regcon-screen">
      <div className="regcon-header">
        <div className="header-row">
          <h2>{t.appName} <span>—</span> {t.register}</h2>
          <button className="btn-back" onClick={() => navigate('/')}>
            {t.back}
          </button>
        </div>
      </div>

      <div className="regcon-body">

        {/* Nombre + Año en una sola línea */}
        <div className="form-row">
            <div className="form-group form-group-name">
                <label>{t.name}</label>
                <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value.toUpperCase())}
                placeholder="Nombre"
                maxLength={15}
                />
            </div>
            <div className="form-group form-group-year">
                <label>{t.birthYear}</label>
                <input
                type="number"
                value={form.birthYear}
                onChange={e => set('birthYear', e.target.value)}
                placeholder="1985"
                min="1930"
                max="2015"
                />
            </div>
        </div>

        {/* Iglesia */}
        <div className="form-group">
          <label>{t.church}</label>
          <div className="chip-grid">
            {t.churches.map(c => (
              <div
                key={c}
                className={`chip ${form.church === c ? 'selected' : ''}`}
                onClick={() => set('church', c)}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Rol */}
        <div className="form-group">
          <label>{t.role}</label>
          <div className="chip-grid">
            {Object.entries(t.roles).map(([key, val]) => (
              <div
                key={key}
                className={`chip ${form.role === key ? 'selected' : ''}`}
                onClick={() => set('role', key)}
              >
                {val}
              </div>
            ))}
          </div>
        </div>

        {/* Plataforma IA */}
        <div className="form-group">
          <label>{t.platform}</label>
          <div className="chip-grid">
            {Object.entries(t.platforms).map(([key, val]) => (
              <div
                key={key}
                className={`chip ${form.platform === key ? 'selected' : ''}`}
                onClick={() => set('platform', key)}
              >
                {val}
              </div>
            ))}
          </div>
        </div>

        {/* Contraseña opcional */}
        <div className="form-group">
          <label>{t.password}</label>
          <input
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            placeholder="Opcional"
          />
        </div>

      </div>

      <div className="regcon-footer">
        <button className="btn-primary" onClick={handleSave}>
          {t.save}
        </button>
      </div>
    </div>
  )
}

export default RegCon