import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import FindGroups from './pages/FindGroups'
import Group from './pages/Group'
import Profile from './pages/Profile'
function Protected({ children }) {
  const { state, ready } = useStore()
  if (!ready)
    return (
      <div className="boot" role="status">
        Loading…
      </div>
    )
  return state.user ? children : <Navigate to="/login" replace />
}
function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route
          path="/app"
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="find" element={<FindGroups />} />
          <Route path="groups/:id" element={<Group />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
