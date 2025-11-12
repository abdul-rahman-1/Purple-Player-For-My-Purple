import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import AddSong from './pages/AddSong'
import Player from './pages/Player'
import LoadingScreen from './components/LoadingScreen'
import RegisterModal from './components/RegisterModal'
import FloatingHearts from './components/FloatingHearts'
import './styles.css'

function AppContent() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setShowLoading(false), 3000)
    return () => clearTimeout(timeout)
  }, [])

  if (showLoading) return <LoadingScreen />

  return (
    <>
      <RegisterModal />
      <FloatingHearts />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-song" element={<AddSong />} />
        <Route path="/player" element={<Player />} />
      </Routes>
    </>
  )
}

export default function App(){
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  )
}
