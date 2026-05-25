import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const AppContext = createContext();

const DEFAULT_PREFS = {
  audience: 'Adultos',
  context: 'Culto',
  emphasis: 'Evangelismo',
  tradition: 'Alianza Cristiana',
  tone: 'Expositivo',
  length: 'Corto (20 min)',
  version: 'RVR1960',
  platform: 'claude',
  content: {
    exegesis: true,
    commentators: true,
    sermons: true,
    course: true,
    devotionals: true
  }
};

const DEFAULT_USER = {
  uuid: null,
  name: '',
  birthYear: '',
  church: '',
  role: '',
  platform: 'claude',
  password: '',
  isRegistered: false,
  prefs: DEFAULT_PREFS
};

export function AppProvider({ children }) {
  const [lang, setLang] = useState('ES');
  const [user, setUser] = useState(DEFAULT_USER);
  const [isFirstTime, setIsFirstTime] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    // Cargar datos del localStorage al iniciar
    const stored = localStorage.getItem('bereano_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setIsFirstTime(!parsed.isRegistered);
    } else {
      // Generar UUID para dispositivo nuevo
      const uuid = crypto.randomUUID();
      setUser(prev => ({ ...prev, uuid }));
    }
  }, []);

  const saveUser = (data) => {
    const updated = { ...user, ...data, isRegistered: true };
    setUser(updated);
    setIsFirstTime(false);
    localStorage.setItem('bereano_user', JSON.stringify(updated));
  };

  const savePrefs = (prefs) => {
    const updated = { ...user, prefs: { ...user.prefs, ...prefs } };
    setUser(updated);
    localStorage.setItem('bereano_user', JSON.stringify(updated));
  };

  const toggleLang = () => setLang(prev => prev === 'ES' ? 'EN' : 'ES');

  return (
    <AppContext.Provider value={{
      lang, t, toggleLang,
      user, saveUser, savePrefs,
      isFirstTime, DEFAULT_PREFS
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}