import { useState } from 'react'
import { useEnvStore } from '@/stores/envStore'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import EnvironmentEditor from '@/components/EnvironmentEditor'
import { GearSix } from '@phosphor-icons/react'
import HistoryList from '@/components/HistoryList'

export default function Sidebar() {
  const environments = useEnvStore((s) => s.environments)
  const activeId = useEnvStore((s) => s.activeId)
  const setActive = useEnvStore((s) => s.setActive)
  const [editorOpen, setEditorOpen] = useState(false)

  return (
    <>
      <aside className="w-[220px] shrink-0 border-r bg-muted/30 flex flex-col">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Environments
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEditorOpen(true)}
              title="Edit environments"
            >
              <GearSix size={12} />
            </Button>
          </div>

          {environments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No environments yet</p>
          ) : (
            <Select
              value={activeId || 'none'}
              onValueChange={(v) => setActive(v === 'none' ? null : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No environment</SelectItem>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Separator />
<div className="p-4 flex-1 overflow-y-auto">
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
    History
  </p>
  <HistoryList />
</div>
      </aside>

      <EnvironmentEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  )
}