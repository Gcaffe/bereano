import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Welcome from './pages/Welcome/Welcome'
import RegCon from './pages/RegCon/RegCon'
import Consulta from './pages/Consulta/Consulta'
import Resultados from './pages/Resultados/Resultados'

function App() {
  const { user } = useApp()

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/regcon" element={<RegCon />} />
      <Route path="/consulta" element={<Consulta />} />
      <Route path="/resultados" element={<Resultados />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App