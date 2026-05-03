import UrlBar from '@/components/UrlBar'

export default function RequestPanel() {
  return (
    <section className="p-4 border-b shrink-0">
      <UrlBar />
      <div className="text-sm text-muted-foreground mt-4">
        Request tabs (Params, Headers, Body, Auth) will live here.
      </div>
    </section>
  )
}