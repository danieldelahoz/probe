import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRequestStore } from '@/stores/requestStore'
import UrlBar from '@/components/UrlBar'
import KeyValueEditor from '@/components/KeyValueEditor'
import BodyEditor from '@/components/BodyEditor'
import AuthEditor from '@/components/AuthEditor'

const TAB_TRIGGER_CLASS = 'bg-transparent border-0 rounded-none px-3 py-1.5 text-xs data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:font-medium text-muted-foreground data-[state=active]:text-foreground'

export default function RequestPanel() {
  const params = useRequestStore((s) => s.params)
  const headers = useRequestStore((s) => s.headers)
  const body = useRequestStore((s) => s.body)
  const auth = useRequestStore((s) => s.auth)
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
        <div className="border-b">
          <TabsList className="bg-transparent p-0 h-auto rounded-none gap-1 justify-start">
            <TabsTrigger value="params" className={TAB_TRIGGER_CLASS}>
              Params {enabledParamCount > 0 && <span className="ml-1 text-muted-foreground">({enabledParamCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="headers" className={TAB_TRIGGER_CLASS}>
              Headers {enabledHeaderCount > 0 && <span className="ml-1 text-muted-foreground">({enabledHeaderCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="body" className={TAB_TRIGGER_CLASS}>
              Body {body.type !== 'none' && <span className="ml-1 text-muted-foreground">●</span>}
            </TabsTrigger>
            <TabsTrigger value="auth" className={TAB_TRIGGER_CLASS}>
              Auth {auth.type !== 'none' && <span className="ml-1 text-muted-foreground">●</span>}
            </TabsTrigger>
          </TabsList>
        </div>
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
        <TabsContent value="body" className="mt-4">
          <BodyEditor />
        </TabsContent>
        <TabsContent value="auth" className="mt-4">
          <AuthEditor />
        </TabsContent>
      </Tabs>
    </section>
  )
}