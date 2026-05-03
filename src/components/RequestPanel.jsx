import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequestStore } from '@/stores/requestStore'
import UrlBar from '@/components/UrlBar'
import KeyValueEditor from '@/components/KeyValueEditor'

export default function RequestPanel() {
  const params = useRequestStore((s) => s.params)
  const headers = useRequestStore((s) => s.headers)
  const addParam = useRequestStore((s) => s.addParam)
  const updateParam = useRequestStore((s) => s.updateParam)
  const removeParam = useRequestStore((s) => s.removeParam)
  const addHeader = useRequestStore((s) => s.addHeader)
  const updateHeader = useRequestStore((s) => s.updateHeader)
  const removeHeader = useRequestStore((s) => s.removeHeader)

  const enabledParamCount = params.filter((p) => p.enabled && p.key.trim()).length
  const enabledHeaderCount = headers.filter((h) => h.enabled && h.key.trim()).length

  return (
    <section className="p-4 border-b shrink-0">
      <UrlBar />
      <Tabs defaultValue="params" className="mt-4">
        <TabsList>
          <TabsTrigger value="params">
            Params {enabledParamCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({enabledParamCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="headers">
            Headers {enabledHeaderCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({enabledHeaderCount})</span>}
          </TabsTrigger>
          <TabsTrigger value="body" disabled>Body</TabsTrigger>
          <TabsTrigger value="auth" disabled>Auth</TabsTrigger>
        </TabsList>
        <TabsContent value="params" className="mt-4">
          <KeyValueEditor
            rows={params}
            onAdd={addParam}
            onUpdate={updateParam}
            onRemove={removeParam}
            keyPlaceholder="Parameter name"
            valuePlaceholder="Value"
          />
        </TabsContent>
        <TabsContent value="headers" className="mt-4">
          <KeyValueEditor
            rows={headers}
            onAdd={addHeader}
            onUpdate={updateHeader}
            onRemove={removeHeader}
            keyPlaceholder="Header name"
            valuePlaceholder="Value"
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}