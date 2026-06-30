import { useState, useEffect } from 'react'
import EditorPage from './pages/index/EditorPage'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return <EditorPage isMobile={isMobile} />
}

export default App
