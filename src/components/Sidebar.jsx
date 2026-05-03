import { Separator } from '@/components/ui/separator'

export default function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 border-r bg-muted/30 flex flex-col">
      <div className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Environments
        </p>
        <p className="text-sm text-muted-foreground italic">No environments yet</p>
      </div>
      <Separator />
      <div className="p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          History
        </p>
        <p className="text-sm text-muted-foreground italic">No requests yet</p>
      </div>
    </aside>
  )
}