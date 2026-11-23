import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
const TOKEN_KEY = 'studycircle:token'
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const setToken = (t) => {
  try {
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)
  } catch {}
}
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
export async function api(path, { method = 'GET', body, form } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: form || (body ? JSON.stringify(body) : void 0),
    })
  } catch {
    throw new ApiError(0, 'Can\u2019t reach the server. Is it running? (npm run dev)')
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`)
  return data
}
export async function downloadItem(item) {
  const res = await fetch(`/api/items/${item.id}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new ApiError(res.status, 'Download failed.')
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: item.title })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1e3)
}
export async function openPdf(item) {
  const tab = window.open('about:blank', '_blank')
  try {
    const res = await fetch(`/api/items/${item.id}/download`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new ApiError(res.status, 'Could not open the file.')
    const url = URL.createObjectURL(new Blob([await res.blob()], { type: 'application/pdf' }))
    if (tab) tab.location.href = url
    else await downloadItem(item)
    setTimeout(() => URL.revokeObjectURL(url), 6e4)
  } catch (e) {
    tab?.close()
    throw e
  }
}
export const isPdf = (item) => item.mime === 'application/pdf' || /\.pdf$/i.test(item.title || '')
const EMPTY = { user: null, groups: [], messages: {}, sessions: [], files: {} }
const AUTH_ACTIONS = new Set(['signup', 'login', 'demo'])
const Ctx = createContext(null)
export function StoreProvider({ children }) {
  const [state, setState] = useState(EMPTY)
  const [ready, setReady] = useState(!getToken())
  const [toast, setToast] = useState('')
  const toastTimer = useRef()
  const say = useCallback((m) => {
    setToast(m)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 4e3)
  }, [])
  const apply = (data) =>
    setState({
      user: data.user,
      groups: data.groups,
      messages: data.messages,
      sessions: data.sessions,
      files: data.files,
    })
  const refresh = useCallback(async () => {
    if (!getToken()) return
    try {
      apply(await api('/bootstrap'))
    } catch (e) {
      if (e.status === 401) {
        setToken(null)
        setState(EMPTY)
      }
    }
  }, [])
  useEffect(() => {
    refresh().finally(() => setReady(true))
  }, [refresh])
  useEffect(() => {
    if (!state.user) return
    const tick = () => {
      if (!document.hidden) refresh()
    }
    const id = setInterval(tick, 4e3)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [state.user?.email, refresh])
  const dispatch = useCallback(
    async (a) => {
      try {
        switch (a.type) {
          case 'signup':
          case 'login':
          case 'demo': {
            const path = { signup: '/auth/signup', login: '/auth/login', demo: '/auth/demo' }[a.type]
            const { token } = await api(path, { method: 'POST', body: a.user })
            setToken(token)
            await refresh()
            return true
          }
          case 'logout':
            setToken(null)
            setState(EMPTY)
            return true
          case 'profile':
            apply(await api('/me', { method: 'PATCH', body: a.patch }))
            return true
          case 'join':
            apply(await api(`/groups/${a.id}/join`, { method: 'POST' }))
            return true
          case 'leave':
            apply(await api(`/groups/${a.id}/leave`, { method: 'POST' }))
            return true
          case 'delGroup':
            await api(`/groups/${a.id}`, { method: 'DELETE' })
            break
          case 'delMessage':
            await api(`/messages/${a.id}`, { method: 'DELETE' })
            break
          case 'automatch':
            apply(await api('/automatch', { method: 'POST' }))
            return true
          case 'create': {
            const { id, ...data } = await api('/groups', { method: 'POST', body: a.group })
            apply(data)
            return id
          }
          case 'message':
            await api(`/groups/${a.groupId}/messages`, { method: 'POST', body: a.message })
            break
          case 'addSession':
            await api(`/groups/${a.session.groupId}/sessions`, { method: 'POST', body: a.session })
            break
          case 'rsvp':
            await api(`/sessions/${a.id}/rsvp`, { method: 'POST' })
            break
          case 'delSession':
            await api(`/sessions/${a.id}`, { method: 'DELETE' })
            break
          case 'addItem':
            await api(`/groups/${a.groupId}/notes`, { method: 'POST', body: a.item })
            break
          case 'upload': {
            const form = new FormData()
            form.append('file', a.file)
            await api(`/groups/${a.groupId}/files`, { method: 'POST', form })
            break
          }
          case 'delItem':
            await api(`/items/${a.id}`, { method: 'DELETE' })
            break
          default:
            return false
        }
        await refresh()
        return true
      } catch (e) {
        if (AUTH_ACTIONS.has(a.type)) throw e
        say(e.message)
        if (e.status === 401) refresh()
        return false
      }
    },
    [refresh, say],
  )
  return (
    <Ctx.Provider value={{ state, dispatch, ready }}>
      {children}
      {toast && (
        <div className="toast" role="alert">
          {toast}
        </div>
      )}
    </Ctx.Provider>
  )
}
export const useStore = () => useContext(Ctx)
