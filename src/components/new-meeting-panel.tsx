import { useState } from 'react'

import { TranscriptDropzone } from '@/components/transcript-dropzone'

// The dropzone and transcript preview. Shared by both homepage layouts.
export function NewMeetingPanel() {
  const [transcript, setTranscript] = useState<string | null>(null)

  return (
    <section aria-label="New meeting" className="space-y-6">
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
    </section>
  )
}
