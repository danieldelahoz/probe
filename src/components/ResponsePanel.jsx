export default function ResponsePanel() {
  return (
    <section className="flex-1 p-4 min-h-[200px]">
      <div className="flex gap-4 mb-3 text-sm">
        <span className="text-muted-foreground">Status: —</span>
        <span className="text-muted-foreground">Time: — ms</span>
        <span className="text-muted-foreground">Size: — B</span>
      </div>
      <div className="bg-muted/30 rounded p-4 text-sm text-muted-foreground italic">
        Response body will appear here after you send a request.
      </div>
    </section>
  )
}