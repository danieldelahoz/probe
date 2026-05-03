import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { loadJSON, saveJSON } from '@/lib/storage'

const PERSIST_KEY = 'environments'
const ACTIVE_KEY = 'activeEnv'

const persisted = loadJSON(PERSIST_KEY, { environments: [] })
const persistedActiveId = loadJSON(ACTIVE_KEY, null)

export const useEnvStore = create((set, get) => ({
  environments: persisted.environments || [],
  activeId: persistedActiveId,

  addEnvironment: (name) => {
    const env = { id: nanoid(), name, variables: [{ id: nanoid(), key: '', value: '' }] }
    set((s) => ({ environments: [...s.environments, env] }))
    return env.id
  },

  renameEnvironment: (id, name) => set((s) => ({
    environments: s.environments.map((e) => e.id === id ? { ...e, name } : e),
  })),

  removeEnvironment: (id) => set((s) => ({
    environments: s.environments.filter((e) => e.id !== id),
    activeId: s.activeId === id ? null : s.activeId,
  })),

  setActive: (id) => set({ activeId: id }),

  addVariable: (envId) => set((s) => ({
    environments: s.environments.map((e) =>
      e.id === envId
        ? { ...e, variables: [...e.variables, { id: nanoid(), key: '', value: '' }] }
        : e
    ),
  })),

  updateVariable: (envId, varId, patch) => set((s) => ({
    environments: s.environments.map((e) =>
      e.id === envId
        ? { ...e, variables: e.variables.map((v) => v.id === varId ? { ...v, ...patch } : v) }
        : e
    ),
  })),

  removeVariable: (envId, varId) => set((s) => ({
    environments: s.environments.map((e) =>
      e.id === envId
        ? { ...e, variables: e.variables.filter((v) => v.id !== varId) }
        : e
    ),
  })),
}))

useEnvStore.subscribe((state) => {
  saveJSON(PERSIST_KEY, { environments: state.environments })
  saveJSON(ACTIVE_KEY, state.activeId)
})

export function getResolvedVars() {
  const { environments, activeId } = useEnvStore.getState()
  const active = environments.find((e) => e.id === activeId)
  if (!active) return {}
  const vars = {}
  active.variables.forEach((v) => {
    if (v.key.trim()) vars[v.key] = v.value
  })
  return vars
}