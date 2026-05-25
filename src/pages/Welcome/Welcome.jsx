import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

function Welcome() {
  const { t, user, isFirstTime, toggleLang, lang } = useApp()
  const navigate = useNavigate()

  return (
    <div className="screen welcome-screen">
      <div className="lang-selector">
        <button onClick={toggleLang} className={lang === 'ES' ? 'active' : ''}>ES</button>
        <button onClick={toggleLang} className={lang === 'EN' ? 'active' : ''}>EN</button>
      </div>

      <div className="welcome-content">
        <div className="church-logo">
            <img src="/src/assets/logo-iglesia.png" alt="Logo Iglesia" className="church-logo-img" />
        </div>

        <h1>{t.welcome}</h1>
        {!isFirstTime && (
          <p className="welcome-back">{t.welcomeBack} <strong>{user.name}</strong></p>
        )}

        <button
          className="btn-primary"
          onClick={() => navigate('/regcon')}
        >
          {isFirstTime ? t.register : t.continue}
        </button>
      </div>
    </div>
  )
}

export default Welcome