import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { loadJSON, saveJSON } from '@/lib/storage'

const PERSIST_KEY = 'history'
const MAX_ENTRIES = 50

const persisted = loadJSON(PERSIST_KEY, { entries: [] })

export const useHistoryStore = create((set) => ({
  entries: persisted.entries || [],

  addEntry: (entry) => set((s) => {
    const newEntry = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      ...entry,
    }
    const next = [newEntry, ...s.entries].slice(0, MAX_ENTRIES)
    return { entries: next }
  }),

  removeEntry: (id) => set((s) => ({
    entries: s.entries.filter((e) => e.id !== id),
  })),

  clearAll: () => set({ entries: [] }),
}))

useHistoryStore.subscribe((state) => {
  saveJSON(PERSIST_KEY, { entries: state.entries })
})