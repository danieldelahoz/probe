import { useState, useEffect } from 'react'
import { useEnvStore } from '@/stores/envStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus, Trash } from '@phosphor-icons/react'

const GRID_COLS = '1fr 1fr 36px'

export default function EnvironmentEditor({ open, onOpenChange }) {
  const environments = useEnvStore((s) => s.environments)
  const addEnvironment = useEnvStore((s) => s.addEnvironment)
  const renameEnvironment = useEnvStore((s) => s.renameEnvironment)
  const removeEnvironment = useEnvStore((s) => s.removeEnvironment)
  const addVariable = useEnvStore((s) => s.addVariable)
  const updateVariable = useEnvStore((s) => s.updateVariable)
  const removeVariable = useEnvStore((s) => s.removeVariable)

  const [activeTabId, setActiveTabId] = useState(environments[0]?.id || null)

  useEffect(() => {
    if (!activeTabId && environments[0]) {
      setActiveTabId(environments[0].id)
    }
  }, [environments, activeTabId])

  const handleAddEnv = () => {
    const id = addEnvironment(`Environment ${environments.length + 1}`)
    setActiveTabId(id)
  }

  const activeEnv = environments.find((e) => e.id === activeTabId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Environments</DialogTitle>
          <DialogDescription>
            Define variables that can be referenced as {`{{name}}`} in URLs, headers, body, and auth.
          </DialogDescription>
        </DialogHeader>

        {environments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">No environments yet.</p>
              <Button onClick={handleAddEnv}>Create your first environment</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: '200px 1fr' }}>
            {/* Left rail: env list */}
            <div className="border-r bg-muted/30 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-scroll probe-scrollbar p-2 space-y-1">
                {environments.map((env) => {
                  const isActive = env.id === activeTabId
                  return (
                    <button
                      key={env.id}
                      onClick={() => setActiveTabId(env.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-mono truncate transition-colors ${
                        isActive
                          ? 'bg-background border border-border'
                          : 'text-muted-foreground hover:bg-background/50'
                      }`}
                    >
                      {env.name || 'Untitled'}
                    </button>
                  )
                })}
              </div>
              <div className="p-2 border-t shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddEnv}
                  className="w-full gap-2 justify-start"
                >
                  <Plus size={14} /> Add environment
                </Button>
              </div>
            </div>

            {/* Right pane: active env editor */}
            {activeEnv && (
              <div className="flex flex-col min-h-0">
                <div className="px-6 py-4 flex-1 min-h-0 flex flex-col">
                  <div
                    className="grid items-center gap-2 mb-4 shrink-0"
                    style={{ gridTemplateColumns: GRID_COLS }}
                  >
                    <div className="col-span-2">
                      <Input
                        value={activeEnv.name}
                        onChange={(e) => renameEnvironment(activeEnv.id, e.target.value)}
                        className="font-medium w-full"
                        placeholder="Environment name"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const remaining = environments.filter((e) => e.id !== activeEnv.id)
                        removeEnvironment(activeEnv.id)
                        setActiveTabId(remaining[0]?.id || null)
                      }}
                      title="Delete environment"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto probe-scrollbar">
                    <div className="space-y-2 pr-2">
                      {activeEnv.variables.map((v) => (
                        <div
                          key={v.id}
                          className="grid items-center gap-2"
                          style={{ gridTemplateColumns: GRID_COLS }}
                        >
                          <Input
                            value={v.key}
                            onChange={(e) => updateVariable(activeEnv.id, v.id, { key: e.target.value })}
                            placeholder="variableName"
                            className="font-mono text-sm min-w-0 w-full"
                          />
                          <Input
                            value={v.value}
                            onChange={(e) => updateVariable(activeEnv.id, v.id, { value: e.target.value })}
                            placeholder="value"
                            className="font-mono text-sm min-w-0 w-full"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (activeEnv.variables.length === 1) {
                                updateVariable(activeEnv.id, v.id, { key: '', value: '' })
                              } else {
                                removeVariable(activeEnv.id, v.id)
                              }
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addVariable(activeEnv.id)}
                        className="gap-2 mt-3"
                      >
                        <Plus size={14} /> Add variable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}