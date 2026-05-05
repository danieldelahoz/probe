import { create } from 'zustand'
import { loadJSON, saveJSON } from '@/lib/storage'

const PERSIST_KEY = 'theme'

const getInitialTheme = () => {
  const saved = loadJSON(PERSIST_KEY, null)
  if (saved === 'light' || saved === 'dark') return saved

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const initial = getInitialTheme()
applyTheme(initial)

export const useThemeStore = create((set) => ({
  theme: initial,

  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    saveJSON(PERSIST_KEY, next)
    return { theme: next }
  }),

  setTheme: (theme) => set(() => {
    applyTheme(theme)
    saveJSON(PERSIST_KEY, theme)
    return { theme }
  }),
}))