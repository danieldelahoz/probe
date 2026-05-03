export default function RequestPanel() {
  return (
    <section className="flex-1 p-4 border-b min-h-[200px]">
      <div className="flex gap-2 mb-4">
        <div className="px-3 py-2 bg-muted rounded text-sm font-medium">GET</div>
        <div className="flex-1 px-3 py-2 bg-muted/50 rounded text-sm text-muted-foreground">
          URL bar coming soon
        </div>
        <div className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium">
          Send
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Request tabs (Params, Headers, Body, Auth) will live here.
      </div>
    </section>
  )
}