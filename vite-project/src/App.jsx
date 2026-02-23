import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginProfessional from './pages/LoginProfessional'
import Dashboard from './pages/Dashboard'
import { Toast } from './components/Toast'
import './App.css'

function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginProfessional />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
