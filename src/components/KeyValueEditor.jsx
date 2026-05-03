import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { X, Plus } from '@phosphor-icons/react'

export default function KeyValueEditor({ rows, onAdd, onUpdate, onRemove, keyPlaceholder, valuePlaceholder }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <Checkbox
            checked={row.enabled}
            onCheckedChange={(checked) => onUpdate(row.id, { enabled: !!checked })}
          />
          <Input
            value={row.key}
            onChange={(e) => onUpdate(row.id, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className="flex-1 font-mono text-sm"
          />
          <Input
            value={row.value}
            onChange={(e) => onUpdate(row.id, { value: e.target.value })}
            placeholder={valuePlaceholder}
            className="flex-1 font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(row.id)}
            disabled={rows.length === 1}
            className="shrink-0"
          >
            <X size={14} />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
        <Plus size={14} />
        Add row
      </Button>
    </div>
  )
}