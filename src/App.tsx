import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-5xl">knots</h1>
        <div className="flex flex-wrap justify-center gap-3">
          <Button>Analyse transcript</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>
    </main>
  )
}

export default App
