import { useRequestStore } from '@/stores/requestStore'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import Editor from '@monaco-editor/react'

export default function BodyEditor() {
  const body = useRequestStore((s) => s.body)
  const setBody = useRequestStore((s) => s.setBody)

  const setType = (type) => setBody({ ...body, type })
  const setContent = (content) => setBody({ ...body, content: content || '' })

  return (
    <div className="space-y-4">
      <RadioGroup value={body.type} onValueChange={setType} className="flex gap-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="none" id="body-none" />
          <Label htmlFor="body-none" className="cursor-pointer">None</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="json" id="body-json" />
          <Label htmlFor="body-json" className="cursor-pointer">JSON</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="text" id="body-text" />
          <Label htmlFor="body-text" className="cursor-pointer">Text</Label>
        </div>
      </RadioGroup>

      {body.type === 'none' && (
        <div className="text-sm text-muted-foreground italic py-8 text-center bg-muted/30 rounded">
          No body. Switch to JSON or Text to add content.
        </div>
      )}

      {body.type === 'json' && (
        <div className="border rounded overflow-hidden">
          <Editor
            height="240px"
            defaultLanguage="json"
            value={body.content}
            onChange={setContent}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono Variable, monospace',
              lineNumbers: 'on',
              folding: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>
      )}

      {body.type === 'text' && (
        <textarea
          value={body.content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Raw text body content..."
          className="w-full h-[240px] p-3 font-mono text-sm bg-muted/30 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  )
}