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
      count: 1,
      ...entry,
    }

    const top = s.entries[0]
    const isDupOfTop = top
      && top.method === newEntry.method
      && top.url === newEntry.url

    if (isDupOfTop) {
      const updated = [
        { ...newEntry, id: top.id, count: (top.count || 1) + 1 },
        ...s.entries.slice(1),
      ]
      return { entries: updated }
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