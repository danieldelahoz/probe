import { useState, useEffect } from 'react'
import { useEnvStore } from '@/stores/envStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus, Trash } from '@phosphor-icons/react'

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Environments</DialogTitle>
          <DialogDescription>
            Define variables that can be referenced as {`{{name}}`} in URLs, headers, body, and auth.
          </DialogDescription>
        </DialogHeader>

        {environments.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No environments yet.</p>
            <Button onClick={handleAddEnv}>Create your first environment</Button>
          </div>
        ) : (
          <Tabs value={activeTabId} onValueChange={setActiveTabId}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {environments.map((env) => (
                <TabsTrigger key={env.id} value={env.id}>
                  {env.name}
                </TabsTrigger>
              ))}
              <Button variant="ghost" size="sm" onClick={handleAddEnv} className="ml-2 gap-1">
                <Plus size={14} /> Add
              </Button>
            </TabsList>

            {environments.map((env) => (
              <TabsContent key={env.id} value={env.id} className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={env.name}
                    onChange={(e) => renameEnvironment(env.id, e.target.value)}
                    className="font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removeEnvironment(env.id)
                      setActiveTabId(environments.find((e) => e.id !== env.id)?.id || null)
                    }}
                    title="Delete environment"
                  >
                    <Trash size={14} />
                  </Button>
                </div>

                <div className="space-y-2">
                  {env.variables.map((v) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <Input
                        value={v.key}
                        onChange={(e) => updateVariable(env.id, v.id, { key: e.target.value })}
                        placeholder="variableName"
                        className="flex-1 font-mono text-sm"
                      />
                      <Input
                        value={v.value}
                        onChange={(e) => updateVariable(env.id, v.id, { value: e.target.value })}
                        placeholder="value"
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (env.variables.length === 1) {
                            updateVariable(env.id, v.id, { key: '', value: '' })
                          } else {
                            removeVariable(env.id, v.id)
                          }
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addVariable(env.id)} className="gap-2">
                    <Plus size={14} /> Add variable
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}