import { useState } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { TranscriptDropzone } from '@/components/transcript-dropzone'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

function App() {
  // The page owns the transcript text; the dropzone only reads the file and
  // hands the text up. Null means nothing has been uploaded yet.
  const [transcript, setTranscript] = useState<string | null>(null)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg">Meetings</h1>
        </header>

        {/* flex-1 fills the space under the header, so centring is relative to the page. */}
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-4xl">Tie up your meeting</h2>
              <p className="text-muted-foreground">
                Upload a transcript to get a summary, decisions and action items.
              </p>
            </div>

            <TranscriptDropzone
              onTranscriptRead={(text) => setTranscript(text)}
              onClear={() => setTranscript(null)}
            />

            {/* Preview of the first 1,000 characters of the transcript. */}
            {transcript && (
              <pre className="max-h-48 overflow-auto rounded-lg border bg-card p-4 text-xs whitespace-pre-wrap">
                {transcript.slice(0, 1000)}
              </pre>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
